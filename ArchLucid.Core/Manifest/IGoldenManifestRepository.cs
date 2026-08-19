using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Manifest;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Core.Manifest;

public interface IGoldenManifestRepository
{
    Task SaveAsync(
        ManifestDocument manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>PR A1 — persist a coordinator-shaped manifest; returns the authority model including computed hash.</summary>
    /// <param name="authorityPersistBody">
    ///     When non-null, this authority-shaped row (full JSON slices) is persisted as-is after
    ///     scope alignment and idempotency-key validation against <paramref name="keying" />; <paramref name="contract" /> is
    ///     still required for API symmetry.
    /// </param>
    Task<ManifestDocument> SaveAsync(
        Cm.GoldenManifest contract,
        ScopeContext scope,
        SaveContractsManifestOptions keying,
        IManifestHashService manifestHashService,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null,
        ManifestDocument? authorityPersistBody = null);

    Task<ManifestDocument?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct);

    /// <summary>
    ///     ADR 0030 — resolves an authority-row manifest whose persisted metadata version matches the coordinator
    ///     <c>ManifestVersion</c> string (see <c>MetadataJson</c> <c>Version</c>), within the caller's scope.
    /// </summary>
    Task<ManifestDocument?> GetByContractManifestVersionAsync(ScopeContext scope, string manifestVersion,
        CancellationToken ct);

    /// <summary>
    ///     Lists prior committed golden manifests in scope for cross-run prior-manifest retrieval indexing
    ///     (excludes <paramref name="excludeRunId" />).
    /// </summary>
    Task<IReadOnlyList<ManifestDocument>> ListPriorCommittedForRetrievalAsync(
        ScopeContext scope,
        Guid excludeRunId,
        int maxManifests,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Marks active golden manifests in the scope as superseded when no non-archived run in that scope references them.
    ///     Intended immediately after finalize wires <paramref name="newManifestId" /> onto the committing run (same SQL transaction when provided).
    /// </summary>
    /// <returns>Manifest identifiers transitioned to superseded; never null (empty when none).</returns>
    Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken);
}
