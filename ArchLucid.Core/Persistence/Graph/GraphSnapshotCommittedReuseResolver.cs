using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Reuses an already-persisted graph for a run when the run header or an orphan save references it (TB-042).
/// </summary>
public static class GraphSnapshotCommittedReuseResolver
{
    /// <summary>
    ///     Returns a committed graph when <paramref name="runGraphSnapshotId" /> loads successfully, or when the latest graph
    ///     for <paramref name="contextSnapshotId" /> belongs to <paramref name="runId" /> (save succeeded but header update
    ///     failed).
    /// </summary>
    public static async Task<GraphSnapshotResolutionResult?> TryResolveAsync(
        ScopeContext scope,
        Guid runId,
        Guid? runGraphSnapshotId,
        Guid contextSnapshotId,
        IGraphSnapshotRepository graphSnapshotRepository,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);

        if (runGraphSnapshotId is Guid headerGraphId)
        {
            GraphSnapshot? fromHeader = await graphSnapshotRepository.GetByIdAsync(scope, headerGraphId, ct);

            if (fromHeader is not null)
                return new GraphSnapshotResolutionResult(fromHeader, "reused_from_run_header");
        }

        GraphSnapshot? latestForContext = await graphSnapshotRepository
            .GetLatestByContextSnapshotIdAsync(scope, contextSnapshotId, ct);

        if (latestForContext is not null && latestForContext.RunId == runId)
            return new GraphSnapshotResolutionResult(latestForContext, "reused_from_orphan_save");

        return null;
    }
}
