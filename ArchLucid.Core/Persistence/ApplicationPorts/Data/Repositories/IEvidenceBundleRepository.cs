using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Persistence contract for <see cref="EvidenceBundle" /> records that capture the
///     policy, service-catalog, and prior-manifest references assembled for a run.
/// </summary>
public interface IEvidenceBundleRepository
{
    /// <summary>Persists a new evidence bundle.</summary>
    /// <param name="evidenceBundle">The bundle to create.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be canceled.</param>
    Task CreateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Returns the evidence bundle with the given primary key, or <see langword="null" /> when not found.
    /// </summary>
    /// <param name="evidenceBundleId">The unique identifier of the bundle.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be cancelled.</param>
    Task<EvidenceBundle?> GetByIdAsync(string evidenceBundleId, CancellationToken cancellationToken = default);

    /// <summary>Creates a bundle with a storage-owned deferred-run binding in the same write as its content.</summary>
    Task CreateForRunAsync(
        EvidenceBundle evidenceBundle, ScopeContext scope, Guid runId, CancellationToken cancellationToken = default,
        IDbConnection? connection = null, IDbTransaction? transaction = null);

    /// <summary>Checks the stored scope and run association without projecting the bundle content.</summary>
    Task<bool> IsBoundToRunAsync(
        ScopeContext scope, Guid runId, string evidenceBundleId, CancellationToken cancellationToken = default);

    /// <summary>Returns content only when the stored scope and run association match; no unbound fallback.</summary>
    Task<EvidenceBundle?> GetForRunAsync(
        ScopeContext scope, Guid runId, string evidenceBundleId, CancellationToken cancellationToken = default);

    /// <summary>Overwrites the stored JSON for an existing bundle (used for late provenance merges).</summary>
    Task UpdateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);
}
