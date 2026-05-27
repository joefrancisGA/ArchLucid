using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>
///     Persistence contract for <see cref="FindingsSnapshot" /> records that capture the
///     structured findings produced by the findings-orchestration pipeline for a run.
/// </summary>
public interface IFindingsSnapshotRepository
{
    /// <summary>
    ///     Persists a findings snapshot. Callers may pass an existing <paramref name="connection" />
    ///     and <paramref name="transaction" /> to participate in a multi-statement transaction.
    /// </summary>
    /// <param name="snapshot">The snapshot to persist.</param>
    /// <param name="ct">Propagates notification that the operation should be cancelled.</param>
    /// <param name="connection">Optional open connection to reuse.</param>
    /// <param name="transaction">Optional transaction to enlist in.</param>
    Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Returns the findings snapshot with the given <paramref name="findingsSnapshotId" />,
    ///     or <see langword="null" /> when not found. Empty <paramref name="scope" /> tenant skips scope predicates (trusted jobs).
    /// </summary>
    Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct);

    /// <summary>
    ///     Stable keyset page over relational <c>dbo.FindingRecords</c> (metadata projection only — no payloads). Pass
    ///     <paramref name="cursorSortOrder" /> and <paramref name="cursorFindingRecordId" /> together after the last item on
    ///     the previous page; both <see langword="null" /> requests the first page.
    /// </summary>
    Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        int? cursorSortOrder,
        Guid? cursorFindingRecordId,
        int? cursorPriorityRank,
        string? severity,
        string? category,
        string? findingType,
        int take,
        bool orderByPriority,
        CancellationToken ct);

    /// <summary>Persists LLM-derived business-impact ranks for findings in a snapshot.</summary>
    Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct);
}
