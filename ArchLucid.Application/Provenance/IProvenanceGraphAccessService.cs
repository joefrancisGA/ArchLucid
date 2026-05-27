using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

namespace ArchLucid.Application.Provenance;

/// <summary>
///     Resolves decision provenance graphs from materialized snapshots or on-demand rebuild (TB-037).
/// </summary>
public interface IProvenanceGraphAccessService
{
    /// <summary>
    ///     Returns a graph when <paramref name="detail" /> satisfies the provenance contract; otherwise <see langword="null" />.
    /// </summary>
    Task<DecisionProvenanceGraph?> ResolveGraphAsync(
        ScopeContext scope,
        RunDetailDto detail,
        CancellationToken ct);

    /// <summary>
    ///     Builds and upserts a provenance snapshot after commit (idempotent per run + revision hash).
    /// </summary>
    Task TryMaterializeSnapshotAsync(
        ScopeContext scope,
        RunDetailDto detail,
        CancellationToken ct);
}
