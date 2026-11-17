using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class SelectiveExecuteIncrementalReReviewCoordinator(
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository agentTaskRepository,
    IArchitectureKnowledgeModelAccess? architectureKnowledgeModelAccess,
    IIncrementalReReviewService incrementalReReviewService,
    IAsyncSpecialistReviewService specialistReviewService,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAuditService auditService,
    IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate,
    IAuthorityFindingsSnapshotUpdater? authorityFindingsSnapshotUpdater = null,
    ILogger<SelectiveExecuteIncrementalReReviewCoordinator>? logger = null) : ISelectiveExecuteIncrementalReReviewCoordinator
{
    private const string StageName = "incremental-re-review";

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _agentTaskRepository =
        agentTaskRepository ?? throw new ArgumentNullException(nameof(agentTaskRepository));

    private readonly IArchitectureKnowledgeModelAccess? _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess;

    private readonly IIncrementalReReviewService _incrementalReReviewService =
        incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IReRunExecuteSealedManifestPinGate _reRunExecuteSealedManifestPinGate =
        reRunExecuteSealedManifestPinGate ?? throw new ArgumentNullException(nameof(reRunExecuteSealedManifestPinGate));

    private readonly IAuthorityFindingsSnapshotUpdater? _authorityFindingsSnapshotUpdater =
        authorityFindingsSnapshotUpdater;

    public async Task<IncrementalReReviewResult?> TryRunAfterSelectiveExecuteAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        if (_architectureKnowledgeModelAccess is null || !Guid.TryParse(runId, out Guid parsedRunId))
            return null;

        await _reRunExecuteSealedManifestPinGate.EnsureReadyAsync(runId, cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
        IReadOnlyList<AgentTask> scheduledTasks =
            await AnalysisRunIdCanonicalization.LoadAgentTasksByRunIdAsync(
                _agentTaskRepository,
                scope,
                canonicalRunId,
                cancellationToken).ConfigureAwait(false);

        if (scheduledTasks.Count == 0)
            return null;

        IReadOnlyList<AgentTask> forcedTasks = SelectiveAgentExecutePlanner.ResolveTasksToForce(scheduledTasks, request);

        ArchitectureKnowledgeModel? model =
            await _architectureKnowledgeModelAccess
                .GetForRunAsync(scope, parsedRunId, cancellationToken)
                .ConfigureAwait(false);

        if (model is null)
            return null;

        IReadOnlyList<AgentType> forcedAgentTypes = forcedTasks
            .Select(task => task.AgentType)
            .Distinct()
            .ToList();

        bool fullReReview = SelectiveExecuteAffectedElementResolver.RequiresFullReReview(forcedAgentTypes);
        IReadOnlyList<string> affectedElementIds = SelectiveExecuteAffectedElementResolver.ResolveAffectedElementIds(
            model,
            forcedAgentTypes,
            request.AffectedElementIds);

        if (!fullReReview && affectedElementIds.Count == 0)
            return null;

        ReReviewScope reReviewScope = new()
        {
            AffectedElementIds = affectedElementIds.ToList(),
            IncludeGlobalInvariantChecks = true,
            FullReReview = fullReReview,
            Trigger = fullReReview ? ReReviewTrigger.MajorTopologyChange : null,
        };

        DateTime startedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await _runStageOutcomesRepository
            .RecordStageStartedAsync(parsedRunId, StageName, startedUtc, cancellationToken)
            .ConfigureAwait(false);

        IncrementalReReviewResult result;
        string outcomeStatus = "error";
        bool reviewFailed = false;

        try
        {
            result = await _incrementalReReviewService.ReReviewAsync(
                model,
                reReviewScope,
                _specialistReviewService,
                cancellationToken).ConfigureAwait(false);

            List<SpecialistReviewFinding> incrementalFindings = result.SpecialistResults
                .SelectMany(specialistResult => specialistResult.Findings)
                .ToList();

            IReadOnlyList<string> mergedFindingIds = [];

            if (incrementalFindings.Count > 0
                && _authorityFindingsSnapshotUpdater is not null
                && Guid.TryParse(runId, out Guid runGuidForFindings))
            {
                mergedFindingIds = await _authorityFindingsSnapshotUpdater.MergeSpecialistFindingsAsync(
                    scope,
                    runGuidForFindings,
                    incrementalFindings,
                    cancellationToken).ConfigureAwait(false);
            }

            result.MergedFindingIds = mergedFindingIds;

            bool allGlobalInvariantsPassed = result.GlobalInvariantResults.All(check => check.Passed);
            outcomeStatus = allGlobalInvariantsPassed ? "succeeded" : "completed-with-invariant-warnings";
        }
        catch
        {
            reviewFailed = true;
            throw;
        }
        finally
        {
            try
            {
                await _runStageOutcomesRepository
                    .RecordStageCompletedAsync(
                        parsedRunId,
                        StageName,
                        outcomeStatus,
                        TimeProvider.System.GetUtcNow().UtcDateTime,
                        CancellationToken.None)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (reviewFailed)
            {
                // A second failure while recording the outcome must not replace the review failure.
                logger?.LogWarning(ex, "Failed to close selective re-review stage for run {RunId}.", parsedRunId);
            }
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.Run.IncrementalReReviewCompleted,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = Guid.TryParse(runId, out Guid auditRunGuid) ? auditRunGuid : null,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    fullReReviewTriggered = result.FullReReviewTriggered,
                    affectedElementCount = reReviewScope.AffectedElementIds.Count,
                    globalInvariantFailureCount = result.GlobalInvariantResults.Count(check => !check.Passed),
                    specialistResultCount = result.SpecialistResults.Count,
                    partialScopeDisclaimer = result.PartialScopeDisclaimer,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return result;
    }
}
