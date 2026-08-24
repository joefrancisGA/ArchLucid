using System.Text.Json;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class SelectiveExecuteIncrementalReReviewCoordinator(
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository agentTaskRepository,
    IArchitectureIntelligencePersistence? architectureIntelligencePersistence,
    IIncrementalReReviewService incrementalReReviewService,
    ISpecialistReviewService specialistReviewService,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAuditService auditService) : ISelectiveExecuteIncrementalReReviewCoordinator
{
    private const string StageName = "incremental-re-review";

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _agentTaskRepository =
        agentTaskRepository ?? throw new ArgumentNullException(nameof(agentTaskRepository));

    private readonly IArchitectureIntelligencePersistence? _architectureIntelligencePersistence =
        architectureIntelligencePersistence;

    private readonly IIncrementalReReviewService _incrementalReReviewService =
        incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));

    private readonly ISpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<IncrementalReReviewResult?> TryRunAfterSelectiveExecuteAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        if (_architectureIntelligencePersistence is null)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> scheduledTasks =
            await _agentTaskRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false)
            ?? [];

        if (scheduledTasks.Count == 0)
            return null;

        IReadOnlyList<AgentTask> forcedTasks = SelectiveAgentExecutePlanner.ResolveTasksToForce(scheduledTasks, request);

        ArchitectureKnowledgeModel? model =
            await _architectureIntelligencePersistence
                .GetModelByRunIdAsync(scope.TenantId.ToString("D"), runId, cancellationToken)
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

        if (Guid.TryParse(runId, out Guid runGuid))
        {
            await _runStageOutcomesRepository
                .RecordStageStartedAsync(runGuid, StageName, startedUtc, cancellationToken)
                .ConfigureAwait(false);
        }

        IncrementalReReviewResult result = _incrementalReReviewService.ReReview(
            model,
            reReviewScope,
            _specialistReviewService);

        bool allGlobalInvariantsPassed = result.GlobalInvariantResults.All(check => check.Passed);
        string outcomeStatus = allGlobalInvariantsPassed ? "succeeded" : "completed-with-invariant-warnings";

        if (Guid.TryParse(runId, out runGuid))
        {
            await _runStageOutcomesRepository
                .RecordStageCompletedAsync(
                    runGuid,
                    StageName,
                    outcomeStatus,
                    TimeProvider.System.GetUtcNow().UtcDateTime,
                    cancellationToken)
                .ConfigureAwait(false);
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
