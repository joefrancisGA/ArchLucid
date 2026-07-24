using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="IFindingsSnapshotRepository" /> with hot-path read caching for
///     <see cref="IFindingsSnapshotRepository.GetByIdAsync" /> (TB-593).
/// </summary>
public sealed class CachingFindingsSnapshotRepository(
    IFindingsSnapshotRepository inner,
    IHotPathReadCache hotPathReadCache,
    IScopeContextProvider scopeContextProvider) : IFindingsSnapshotRepository
{
    private readonly IFindingsSnapshotRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        await _inner.SaveAsync(snapshot, ct, connection, transaction);

        if (connection is not null)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await HotPathCacheEviction.RemoveFindingsSnapshotAsync(
            _hotPathReadCache,
            scope,
            snapshot.FindingsSnapshotId,
            ct);
    }

    /// <inheritdoc />
    public Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.FindingsSnapshot(scope, findingsSnapshotId),
            innerCt => _inner.GetByIdAsync(scope, findingsSnapshotId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<FindingsSnapshot?> GetCoverageProjectionByIdAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        // Do not reuse the full-snapshot hot-path cache key — coverage omits PayloadJson (TB-930).
        return _inner.GetCoverageProjectionByIdAsync(scope, findingsSnapshotId, ct);
    }

    /// <inheritdoc />
    public Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
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
        CancellationToken ct)
        => _inner.ListFindingRecordsKeysetAsync(
            scope,
            findingsSnapshotId,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            severity,
            category,
            findingType,
            take,
            orderByPriority,
            ct);

    /// <inheritdoc />
    public Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct)
        => _inner.UpdatePriorityRanksAsync(scope, findingsSnapshotId, ranks, ct);
}
