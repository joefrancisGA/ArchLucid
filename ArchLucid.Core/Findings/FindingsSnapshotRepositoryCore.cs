using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings.Serialization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Shared findings snapshot repository rules for in-memory and SQL implementations.
///     Lives in Core so Decisioning adapters do not take a Persistence assembly dependency.
/// </summary>
public static class FindingsSnapshotRepositoryCore
{
    public const int MaxInMemoryEntries = 500;

    public static void PrepareSnapshotForSave(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        FindingsSnapshotMigrator.Apply(snapshot);
    }

    public static string? NormalizeFilter(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();

    public static Guid StableFindingRecordId(Guid findingsSnapshotId, int sortOrder, string findingId)
    {
        byte[] utf8 = Encoding.UTF8.GetBytes($"{findingsSnapshotId:N}:{sortOrder}:{findingId}");
        Span<byte> hash = stackalloc byte[32];

        SHA256.HashData(utf8, hash);

        return new Guid(hash[..16]);
    }

    public static ScopeContext? CaptureScopeAtSave(IScopeContextProvider? scopeContextProvider)
    {
        if (scopeContextProvider is null)
            return null;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        return scope;
    }

    public static bool ScopeMatches(ScopeContext saved, ScopeContext requested)
    {
        ArgumentNullException.ThrowIfNull(saved);
        ArgumentNullException.ThrowIfNull(requested);

        if (requested.TenantId == Guid.Empty)
            return true;

        return saved.TenantId == requested.TenantId
               && saved.WorkspaceId == requested.WorkspaceId
               && saved.ProjectId == requested.ProjectId;
    }

    public static void ValidateFindingKeysetCursor(int? cursorSortOrder, Guid? cursorFindingRecordId)
    {
        if (cursorSortOrder.HasValue ^ cursorFindingRecordId.HasValue)
            throw new ArgumentException(
                "Cursor requires both sortOrder and findingRecordId, or neither for the first page.");
    }

    public static int ClampKeysetTake(int take) =>
        Math.Clamp(take <= 0 ? FindingPagination.DefaultTake : take, 1, FindingPagination.MaxTake);

    public static bool MatchesFindingFilters(
        Finding finding,
        string? normalizedSeverity,
        string? normalizedCategory,
        string? normalizedFindingType)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (normalizedSeverity is not null
            && !string.Equals(finding.Severity.ToString(), normalizedSeverity, StringComparison.OrdinalIgnoreCase))
            return false;

        if (normalizedCategory is not null
            && !string.Equals(finding.Category, normalizedCategory, StringComparison.OrdinalIgnoreCase))
            return false;

        return normalizedFindingType is null
               || string.Equals(finding.FindingType, normalizedFindingType, StringComparison.OrdinalIgnoreCase);
    }

    public static IEnumerable<FindingKeysetEnvelope> BuildFindingEnvelopes(
        FindingsSnapshot snapshot,
        Guid findingsSnapshotId,
        Func<string, int?>? resolvePriorityRank = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return Enumerable.Range(0, snapshot.Findings.Count)
            .Select(i =>
            {
                Finding finding = snapshot.Findings[i];
                Guid recordId = StableFindingRecordId(findingsSnapshotId, i, finding.FindingId);
                int? priorityRank = resolvePriorityRank?.Invoke(finding.FindingId);

                return new FindingKeysetEnvelope(i, recordId, finding, priorityRank);
            });
    }

    public static List<FindingKeysetEnvelope> OrderFindingEnvelopes(
        IEnumerable<FindingKeysetEnvelope> envelopes,
        bool orderByPriority)
    {
        ArgumentNullException.ThrowIfNull(envelopes);

        return orderByPriority
            ? envelopes
                .OrderBy(envelope => envelope.PriorityRank ?? int.MaxValue)
                .ThenBy(envelope => envelope.SortOrder)
                .ThenBy(envelope => envelope.RecordId)
                .ToList()
            : envelopes.OrderBy(envelope => envelope.SortOrder).ThenBy(envelope => envelope.RecordId).ToList();
    }

    public static IEnumerable<FindingKeysetEnvelope> PageAfterKeysetCursor(
        IReadOnlyList<FindingKeysetEnvelope> ordered,
        bool orderByPriority,
        int cursorSortOrder,
        Guid cursorFindingRecordId,
        int? cursorPriorityRank)
    {
        ArgumentNullException.ThrowIfNull(ordered);

        if (orderByPriority)
        {
            int effectivePriorityRank = cursorPriorityRank ?? int.MaxValue;

            return ordered.Where(envelope =>
                (envelope.PriorityRank ?? int.MaxValue) > effectivePriorityRank
                || ((envelope.PriorityRank ?? int.MaxValue) == effectivePriorityRank
                    && (envelope.SortOrder > cursorSortOrder
                        || (envelope.SortOrder == cursorSortOrder
                            && envelope.RecordId.CompareTo(cursorFindingRecordId) > 0))));
        }

        return ordered.Where(envelope =>
            envelope.SortOrder > cursorSortOrder
            || (envelope.SortOrder == cursorSortOrder
                && envelope.RecordId.CompareTo(cursorFindingRecordId) > 0));
    }

    public static FindingRecordMetadataPage BuildKeysetPage(
        IEnumerable<FindingKeysetEnvelope> ordered,
        bool orderByPriority,
        int? cursorSortOrder,
        Guid? cursorFindingRecordId,
        int? cursorPriorityRank,
        int take)
    {
        ArgumentNullException.ThrowIfNull(ordered);

        int cappedTake = ClampKeysetTake(take);
        int fetch = cappedTake + 1;
        List<FindingKeysetEnvelope> orderedList = ordered as List<FindingKeysetEnvelope> ?? ordered.ToList();

        IEnumerable<FindingKeysetEnvelope> pageSource = orderedList;

        if (cursorSortOrder.HasValue && cursorFindingRecordId.HasValue)
        {
            pageSource = PageAfterKeysetCursor(
                orderedList,
                orderByPriority,
                cursorSortOrder.Value,
                cursorFindingRecordId.Value,
                cursorPriorityRank);
        }

        List<FindingKeysetEnvelope> slice = pageSource.Take(fetch).ToList();
        bool hasMore = slice.Count > cappedTake;

        if (hasMore)
            slice.RemoveAt(slice.Count - 1);

        FindingRecordMetadataRow[] rows = slice
            .Select(static envelope =>
                new FindingRecordMetadataRow(
                    envelope.RecordId,
                    envelope.SortOrder,
                    envelope.Finding.FindingId,
                    envelope.Finding.FindingType,
                    envelope.Finding.Category,
                    envelope.Finding.EngineType,
                    envelope.Finding.Severity.ToString(),
                    envelope.Finding.Title,
                    envelope.PriorityRank))
            .ToArray();

        return new FindingRecordMetadataPage(rows, hasMore);
    }

    public static Guid? SelectInMemoryEvictionKey(IReadOnlyDictionary<Guid, string> store, Guid incomingSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(store);

        if (store.Count < MaxInMemoryEntries || store.ContainsKey(incomingSnapshotId))
            return null;

        return store.Keys.First();
    }

    public static void StripFindingPayloads(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        foreach (Finding finding in snapshot.Findings)
            finding.Payload = null;
    }
}
