using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Projection;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Enqueues durable post-commit projection rows (TB-309).</summary>
public sealed class PostCommitProjectionEnqueuer(IPostCommitProjectionOutboxRepository outboxRepository)
{
    private readonly IPostCommitProjectionOutboxRepository _outboxRepository =
        outboxRepository ?? throw new ArgumentNullException(nameof(outboxRepository));

    public Task EnqueueAfterCommitAsync(
        Guid runGuid,
        ScopeContext scope,
        bool enqueueSampleRunPurge,
        bool enqueueFindingPriorityRerank,
        bool enqueueIacStubGeneration,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        List<Task> tasks =
        [
            EnqueueAsync(
                PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                scope,
                runGuid,
                null,
                cancellationToken),
            EnqueueAsync(
                PostCommitProjectionWorkTypes.ReviewCompletedEvent,
                scope,
                runGuid,
                PostCommitProjectionPayloadJson.Serialize(new PostCommitProjectionPayload
                {
                    ProjectId = scope.ProjectId.ToString("N")
                }),
                cancellationToken),
            EnqueueAsync(
                PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization,
                scope,
                runGuid,
                null,
                cancellationToken)
        ];

        if (enqueueFindingPriorityRerank)
        {
            tasks.Add(EnqueueAsync(
                PostCommitProjectionWorkTypes.FindingPriorityRerank,
                scope,
                runGuid,
                null,
                cancellationToken));
        }

        if (enqueueIacStubGeneration)
        {
            tasks.Add(EnqueueAsync(
                PostCommitProjectionWorkTypes.IacStubGeneration,
                scope,
                runGuid,
                null,
                cancellationToken));
        }

        if (enqueueSampleRunPurge)
        {
            tasks.Add(EnqueueAsync(
                PostCommitProjectionWorkTypes.SampleRunPurgeForTenant,
                scope,
                runId: null,
                payloadJson: null,
                cancellationToken));
        }

        return Task.WhenAll(tasks);
    }

    /// <summary>
    ///     Enqueues durable decision-node materialization for idempotent commit replay when the original
    ///     post-commit row may be missing or not yet processed (TB-2060).
    /// </summary>
    public Task EnqueueDecisionEngineV2NodeMaterializationAsync(
        Guid runGuid,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return EnqueueAsync(
            PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization,
            scope,
            runGuid,
            null,
            cancellationToken);
    }

    private Task EnqueueAsync(
        string workType,
        ScopeContext scope,
        Guid? runId,
        string? payloadJson,
        CancellationToken cancellationToken)
    {
        return _outboxRepository.EnqueueAsync(
            workType,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId,
            payloadJson,
            cancellationToken);
    }
}
