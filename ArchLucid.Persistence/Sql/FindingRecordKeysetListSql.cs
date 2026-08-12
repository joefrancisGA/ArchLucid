using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Keyset page statements for <c>dbo.FindingRecords</c> (TB-929). Two orderings are supported: the stable
///     <c>SortOrder</c> sequence and the triage ordering by <c>PriorityRank</c>. Unranked rows sort last via
///     <c>COALESCE(PriorityRank, 2147483647)</c>, which keeps the keyset comparison total and the page boundary stable.
/// </summary>
internal static class FindingRecordKeysetListSql
{
    /// <summary>Sort value substituted for <c>NULL</c> ranks so unranked findings trail ranked ones deterministically.</summary>
    private const string UnrankedSortValue = "2147483647";

    private const string FilterPredicates = """
                                              AND (@Severity IS NULL OR Severity = @Severity)
                                              AND (@Category IS NULL OR Category = @Category)
                                              AND (@FindingType IS NULL OR FindingType = @FindingType)
                                            """;

    public static string BuildKeysetPage(ScopeContext scope, bool orderByPriority) =>
        orderByPriority
            ? BuildPriorityOrderedPage(scope)
            : BuildSortOrderPage(scope);

    private static string BuildPriorityOrderedPage(ScopeContext scope) =>
        $"""
         SELECT TOP (@Limit)
                {FindingRecordListSql.SelectMetadataColumns}
         FROM dbo.FindingRecords
         WHERE FindingsSnapshotId = @FsId{PersistenceTenantScope.AndTripleWhere(scope)}
         {FilterPredicates}
           AND (
             @HasCursor = 0
             OR (
               COALESCE(PriorityRank, {UnrankedSortValue}) > COALESCE(@CurPr, {UnrankedSortValue})
               OR (
                 COALESCE(PriorityRank, {UnrankedSortValue}) = COALESCE(@CurPr, {UnrankedSortValue})
                 AND (
                   SortOrder > @CurSo OR (SortOrder = @CurSo AND FindingRecordId > @CurFrid)
                 )
               )
             )
           )
         ORDER BY COALESCE(PriorityRank, {UnrankedSortValue}) ASC, SortOrder ASC, FindingRecordId ASC;
         """;

    private static string BuildSortOrderPage(ScopeContext scope) =>
        $"""
         SELECT TOP (@Limit)
                {FindingRecordListSql.SelectMetadataColumns}
         FROM dbo.FindingRecords
         WHERE FindingsSnapshotId = @FsId{PersistenceTenantScope.AndTripleWhere(scope)}
         {FilterPredicates}
           AND (
             @HasCursor = 0
             OR (
               SortOrder > @CurSo OR (SortOrder = @CurSo AND FindingRecordId > @CurFrid)
             )
           )
         ORDER BY SortOrder ASC, FindingRecordId ASC;
         """;
}
