namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Keyset page request for finding metadata (TB-929). The cursor is either fully present (resume) or fully absent
///     (first page); a partial cursor cannot produce a stable page boundary and is rejected.
/// </summary>
internal sealed record FindingRecordKeysetPageRequest(
    Guid FindingsSnapshotId,
    int? CursorSortOrder,
    Guid? CursorFindingRecordId,
    int? CursorPriorityRank,
    string? Severity,
    string? Category,
    string? FindingType,
    int Take,
    bool OrderByPriority)
{
    public bool HasCursor => CursorSortOrder.HasValue && CursorFindingRecordId.HasValue;

    public void Validate()
    {
        if (CursorSortOrder.HasValue ^ CursorFindingRecordId.HasValue)
            throw new ArgumentException(
                "Cursor requires both sortOrder and findingRecordId, or neither for the first page.");
    }
}
