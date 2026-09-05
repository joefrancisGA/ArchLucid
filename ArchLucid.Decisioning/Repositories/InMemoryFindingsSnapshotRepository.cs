using System.Data;

using ArchLucid.Core.Findings;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Repositories;

/// <summary>
///     In-memory implementation of <see cref="IFindingsSnapshotRepository" /> for testing and local development.
///     Stores snapshots as serialized JSON, capped at 500 entries (evicting the oldest by insertion order).
/// </summary>
/// <remarks>
///     Uses <see cref="FindingsSerialization" /> (same as SQL <c>FindingsJson</c> writes) so <see cref="Finding" />
///     payloads
///     and <see cref="FindingJsonConverter" /> round-trip; generic Web JSON drops typed payload fidelity and can empty
///     <c>findings</c>.
/// </remarks>
public class InMemoryFindingsSnapshotRepository : IFindingsSnapshotRepository
{
    private readonly Lock _lock = new();

    private readonly IScopeContextProvider? _scopeContextProvider;

    private readonly Dictionary<Guid, string> _store = [];

    private readonly Dictionary<Guid, ScopeContext> _scopeBySnapshotId = [];

    private readonly Dictionary<(Guid SnapshotId, string FindingId), int> _priorityRanks = new();

    public InMemoryFindingsSnapshotRepository()
    {
    }

    public InMemoryFindingsSnapshotRepository(IScopeContextProvider scopeContextProvider)
    {
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    }

    public Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = ct;
        _ = connection;
        _ = transaction;
        FindingsSnapshotRepositoryCore.PrepareSnapshotForSave(snapshot);
        string json = FindingsSerialization.SerializeSnapshot(snapshot);
        ScopeContext? savedScope = FindingsSnapshotRepositoryCore.CaptureScopeAtSave(_scopeContextProvider);
        lock (_lock)
        {
            Guid? evictKey = FindingsSnapshotRepositoryCore.SelectInMemoryEvictionKey(_store, snapshot.FindingsSnapshotId);

            if (evictKey is Guid evict)
            {
                _store.Remove(evict);
                _scopeBySnapshotId.Remove(evict);
            }

            _store[snapshot.FindingsSnapshotId] = json;

            if (savedScope is not null)
                _scopeBySnapshotId[snapshot.FindingsSnapshotId] = savedScope;
            else
                _scopeBySnapshotId.Remove(snapshot.FindingsSnapshotId);
        }

        return Task.CompletedTask;
    }

    public Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;

        if (!TryGetScopedSnapshotJson(scope, findingsSnapshotId, out string? json))
            return Task.FromResult<FindingsSnapshot?>(null);

        FindingsSnapshot snapshot = FindingsSerialization.DeserializeSnapshot(json!);
        return Task.FromResult<FindingsSnapshot?>(snapshot);
    }

    /// <inheritdoc />
    public Task<FindingsSnapshot?> GetCoverageProjectionByIdAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;

        if (!TryGetScopedSnapshotJson(scope, findingsSnapshotId, out string? json))
            return Task.FromResult<FindingsSnapshot?>(null);

        FindingsSnapshot snapshot = FindingsSerialization.DeserializeSnapshot(json!);
        FindingsSnapshotRepositoryCore.StripFindingPayloads(snapshot);

        return Task.FromResult<FindingsSnapshot?>(snapshot);
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
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;

        FindingsSnapshotRepositoryCore.ValidateFindingKeysetCursor(cursorSortOrder, cursorFindingRecordId);

        if (!TryGetScopedSnapshotJson(scope, findingsSnapshotId, out string? json))
            return Task.FromResult(new FindingRecordMetadataPage([], false));

        FindingsSnapshot snapshot = FindingsSerialization.DeserializeSnapshot(json!);

        string? normalizedSeverity = FindingsSnapshotRepositoryCore.NormalizeFilter(severity);
        string? normalizedCategory = FindingsSnapshotRepositoryCore.NormalizeFilter(category);
        string? normalizedFindingType = FindingsSnapshotRepositoryCore.NormalizeFilter(findingType);

        IEnumerable<FindingKeysetEnvelope> envelopes = FindingsSnapshotRepositoryCore
            .BuildFindingEnvelopes(snapshot, findingsSnapshotId, findingId => ResolvePriorityRank(findingsSnapshotId, findingId))
            .Where(envelope => FindingsSnapshotRepositoryCore.MatchesFindingFilters(
                envelope.Finding,
                normalizedSeverity,
                normalizedCategory,
                normalizedFindingType));

        List<FindingKeysetEnvelope> ordered =
            FindingsSnapshotRepositoryCore.OrderFindingEnvelopes(envelopes, orderByPriority);

        FindingRecordMetadataPage page = FindingsSnapshotRepositoryCore.BuildKeysetPage(
            ordered,
            orderByPriority,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            take);

        return Task.FromResult(page);
    }

    public Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        ArgumentNullException.ThrowIfNull(ranks);

        if (ranks.Count == 0)
            return Task.CompletedTask;

        if (!TryGetScopedSnapshotJson(scope, findingsSnapshotId, out _))
            return Task.CompletedTask;

        lock (_lock)
        {
            foreach ((string findingId, int priorityRank) in ranks)
            {
                if (string.IsNullOrWhiteSpace(findingId))
                    continue;

                _priorityRanks[(findingsSnapshotId, findingId.Trim())] = priorityRank;
            }
        }

        return Task.CompletedTask;
    }

    private bool TryGetScopedSnapshotJson(ScopeContext scope, Guid findingsSnapshotId, out string? json)
    {
        ArgumentNullException.ThrowIfNull(scope);
        json = null;
        ScopeContext? savedScope;
        lock (_lock)
        {
            if (!_store.TryGetValue(findingsSnapshotId, out json))
                return false;

            _scopeBySnapshotId.TryGetValue(findingsSnapshotId, out savedScope);
        }

        if (savedScope is not null && !FindingsSnapshotRepositoryCore.ScopeMatches(savedScope, scope))
        {
            json = null;
            return false;
        }

        return true;
    }

    private int? ResolvePriorityRank(Guid findingsSnapshotId, string findingId)
    {
        lock (_lock)
            return _priorityRanks.TryGetValue((findingsSnapshotId, findingId), out int rank) ? rank : null;
    }
}
