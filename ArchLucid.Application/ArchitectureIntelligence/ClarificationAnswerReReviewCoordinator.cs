using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Runs incremental re-review after operator clarification answers are applied onto κ.
/// </summary>
public interface IClarificationAnswerReReviewCoordinator
{
    Task<IncrementalReReviewResult?> TryRunAfterApplyAsync(
        ScopeContext scope,
        Guid runId,
        int appliedAnswerCount,
        CancellationToken cancellationToken = default);
}

public sealed class ClarificationAnswerReReviewCoordinator(
    IArchitectureKnowledgeModelAccess? architectureKnowledgeModelAccess,
    IIncrementalReReviewService incrementalReReviewService,
    IAsyncSpecialistReviewService specialistReviewService,
    IAuthorityFindingsSnapshotUpdater? authorityFindingsSnapshotUpdater,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAuditService auditService) : IClarificationAnswerReReviewCoordinator
{
    private const string StageName = "clarification-re-review";

    private readonly IArchitectureKnowledgeModelAccess? _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess;

    private readonly IIncrementalReReviewService _incrementalReReviewService =
        incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IAuthorityFindingsSnapshotUpdater? _authorityFindingsSnapshotUpdater =
        authorityFindingsSnapshotUpdater;

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<IncrementalReReviewResult?> TryRunAfterApplyAsync(
        ScopeContext scope,
        Guid runId,
        int appliedAnswerCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (appliedAnswerCount <= 0
            || runId == Guid.Empty
            || _architectureKnowledgeModelAccess is null)
            return null;

        ArchitectureKnowledgeModel? model = await _architectureKnowledgeModelAccess
            .GetForRunAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (model is null)
            return null;

        ReReviewScope reReviewScope = new()
        {
            IncludeGlobalInvariantChecks = true,
            FullReReview = true,
            Trigger = ReReviewTrigger.MajorTopologyChange,
        };

        DateTime startedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await _runStageOutcomesRepository
            .RecordStageStartedAsync(runId, StageName, startedUtc, cancellationToken)
            .ConfigureAwait(false);

        IncrementalReReviewResult result = await _incrementalReReviewService.ReReviewAsync(
            model,
            reReviewScope,
            _specialistReviewService,
            cancellationToken).ConfigureAwait(false);

        List<SpecialistReviewFinding> incrementalFindings = result.SpecialistResults
            .SelectMany(specialistResult => specialistResult.Findings)
            .ToList();

        if (incrementalFindings.Count > 0 && _authorityFindingsSnapshotUpdater is not null)
        {
            await _authorityFindingsSnapshotUpdater.MergeSpecialistFindingsAsync(
                scope,
                runId,
                incrementalFindings,
                cancellationToken).ConfigureAwait(false);
        }

        bool allGlobalInvariantsPassed = result.GlobalInvariantResults.All(check => check.Passed);
        string outcomeStatus = allGlobalInvariantsPassed ? "succeeded" : "completed-with-invariant-warnings";

        await _runStageOutcomesRepository
            .RecordStageCompletedAsync(
                runId,
                StageName,
                outcomeStatus,
                TimeProvider.System.GetUtcNow().UtcDateTime,
                cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.Run.IncrementalReReviewCompleted,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId = runId.ToString("D"),
                    trigger = "clarification-answers-applied",
                    appliedAnswerCount,
                    fullReReviewTriggered = result.FullReReviewTriggered,
                    mergedFindingCount = incrementalFindings.Count,
                    partialScopeDisclaimer = result.PartialScopeDisclaimer,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return result;
    }
}
