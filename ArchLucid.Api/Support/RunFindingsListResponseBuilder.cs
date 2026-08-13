using ArchLucid.Contracts.Findings;

namespace ArchLucid.Api.Support;

/// <summary>
///     Projects a keyset page of finding metadata plus ITSM/governance tracking into the run findings list contract.
/// </summary>
public static class RunFindingsListResponseBuilder
{
    private const string PriorityOrder = "priority";
    private const string SortOrderOrder = "sortOrder";

    /// <summary>Order-by token echoed in the response body and in the conditional-GET fingerprint.</summary>
    public static string OrderToken(bool orderByPriority)
    {
        return orderByPriority ? PriorityOrder : SortOrderOrder;
    }

    /// <summary>True when the caller requested priority ordering (case-insensitive query token).</summary>
    public static bool IsPriorityOrder(string? orderBy)
    {
        return string.Equals(orderBy, PriorityOrder, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Request-shape fingerprint combined with the run row version to form the findings-page ETag; every input that
    ///     changes the page contents must appear here or clients could be served a stale 304.
    /// </summary>
    public static string BuildRequestFingerprint(
        Guid snapshotId,
        bool orderByPriority,
        int take,
        int? cursorSortOrder,
        int? cursorPriorityRank,
        Guid? cursorFindingRecordId)
    {
        return $"findings:{snapshotId:N}|order={OrderToken(orderByPriority)}|take={take}"
            + $"|cs={cursorSortOrder}|cp={cursorPriorityRank}|cf={cursorFindingRecordId}";
    }

    /// <summary>Distinct trimmed finding ids on the page, used to batch the external-tracking lookup.</summary>
    public static string[] CollectFindingIds(FindingRecordMetadataPage page)
    {
        ArgumentNullException.ThrowIfNull(page);

        return page.Items
            .Select(static row => row.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    /// <summary>Builds the response body, including keyset continuation cursors when more rows remain.</summary>
    public static RunFindingsListResponse Build(
        string runId,
        bool orderByPriority,
        FindingRecordMetadataPage page,
        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(page);
        ArgumentNullException.ThrowIfNull(trackingByFindingId);

        RunFindingListItem[] items = page.Items
            .Select(row => ToListItem(row, trackingByFindingId))
            .ToArray();

        RunFindingsListResponse body = new()
        {
            RunId = runId.Trim(),
            OrderBy = OrderToken(orderByPriority),
            Items = items,
            HasMore = page.HasMore
        };

        if (page.HasMore && items.Length > 0)
        {
            RunFindingListItem last = items[^1];
            body.NextCursorSortOrder = last.SortOrder;
            body.NextCursorPriorityRank = last.PriorityRank;
            body.NextCursorFindingRecordId = last.FindingRecordId;
        }

        return body;
    }

    private static RunFindingListItem ToListItem(
        FindingRecordMetadataRow row,
        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId)
    {
        RunFindingListItem item = new()
        {
            FindingRecordId = row.FindingRecordId,
            FindingId = row.FindingId,
            Severity = row.Severity,
            Category = row.Category,
            FindingType = row.FindingType,
            Title = row.Title,
            SortOrder = row.SortOrder,
            PriorityRank = row.PriorityRank
        };

        if (!trackingByFindingId.TryGetValue(row.FindingId.Trim(), out RunFindingExternalTrackingProjection? tracking))
            return item;

        item.HumanReviewStatus = tracking.HumanReviewStatus;
        item.LatestDisposition = tracking.LatestDisposition;
        item.RevisitDueUtc = tracking.RevisitDueUtc;
        item.Provider = tracking.Provider;
        item.ExternalKey = tracking.ExternalKey;
        item.ExternalUrl = tracking.ExternalUrl;
        item.ItsmLinkedTicketsSummary = tracking.ItsmLinkedTicketsSummary;
        item.TrackedExternally = tracking.TrackedExternally;
        item.ExternalTrackingSummary = tracking.ExternalTrackingSummary;

        return item;
    }
}
