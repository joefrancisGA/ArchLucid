namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Findings keyset list projection without <c>PayloadJson</c> (TB-929).
/// </summary>
internal static class FindingRecordListSql
{
    /// <summary>Metadata columns for <c>ListFindingRecordsKeysetAsync</c>.</summary>
    public const string SelectMetadataColumns = """
                                                FindingRecordId, SortOrder, FindingId, FindingType, Category, EngineType, Severity, Title, PriorityRank
                                                """;
}
