using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Persistence contract for <see cref="TechnologyLedgerEntry" /> records — the canonical per-run technology
///     facts used to keep architecture generation output internally consistent (additive, unwired step; see
///     docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md).
/// </summary>
public interface ITechnologyLedgerRepository
{
    /// <summary>Persists a single ledger entry.</summary>
    /// <param name="entry">The entry to add.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be canceled.</param>
    Task AddAsync(
        TechnologyLedgerEntry entry,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Returns all ledger entries for the specified run, ordered by <c>CreatedUtc</c> ascending.
    /// </summary>
    /// <param name="scope">Tenant/workspace/project scope for the run-child read.</param>
    /// <param name="runId">The run whose ledger entries are requested.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be canceled.</param>
    Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>Full-row update of an existing ledger entry (e.g. status, lock, or rationale changes).</summary>
    /// <param name="entry">The entry with updated field values; matched by <see cref="TechnologyLedgerEntry.EntryId" />.</param>
    /// <param name="cancellationToken">Propagates notification that the operation should be cancelled.</param>
    Task UpdateAsync(
        TechnologyLedgerEntry entry,
        CancellationToken cancellationToken = default);
}
