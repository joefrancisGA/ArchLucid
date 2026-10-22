using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Composes the scope-aware <c>dbo.FindingsSnapshots</c> statements used by
///     <c>SqlFindingsSnapshotRepository</c> so column lists, tenant predicates, and statement shapes stay in one place.
/// </summary>
internal static class FindingsSnapshotStatementFactory
{
    /// <summary>Full snapshot header (including <c>FindingsJson</c>) for a single snapshot id.</summary>
    public static string BuildSelectHeaderById(ScopeContext scope) =>
        $"""
         SELECT
             {FindingsSnapshotReadSql.SelectHeaderColumns}
         FROM dbo.FindingsSnapshots
         WHERE FindingsSnapshotId = @FindingsSnapshotId{PersistenceTenantScope.AndProjectIdTripleWhere(scope)};
         """;

    /// <summary>Coverage-projection header scalars only — no <c>FindingsJson</c> LOB column (TB-930).</summary>
    public static string BuildSelectCoverageHeaderById(ScopeContext scope) =>
        $"""
         SELECT
             {FindingsSnapshotCoverageSql.SelectHeaderColumns}
         FROM dbo.FindingsSnapshots
         WHERE FindingsSnapshotId = @FindingsSnapshotId{PersistenceTenantScope.AndProjectIdTripleWhere(scope)};
         """;

    /// <summary>Coverage-projection finding metadata in stable <c>SortOrder</c> sequence.</summary>
    public static string BuildSelectCoverageFindingMetadata(ScopeContext scope) =>
        $"""
         SELECT
             {FindingsSnapshotCoverageSql.SelectFindingMetadataColumns}
         FROM dbo.FindingRecords
         WHERE FindingsSnapshotId = @FindingsSnapshotId{PersistenceTenantScope.AndTripleWhere(scope)}
         ORDER BY SortOrder ASC;
         """;

    /// <summary>Relational row count for a snapshot, used to decide relational read vs <c>FindingsJson</c> fallback.</summary>
    public static string BuildCountFindingRecords(ScopeContext scope) =>
        FindingsSnapshotWriteSql.CountFindingRecordsBySnapshotId + PersistenceTenantScope.AndTripleWhere(scope);

    /// <summary>
    ///     Scope predicate for the priority-rank batch update, which aliases <c>dbo.FindingRecords</c> as <c>fr</c> and so
    ///     cannot reuse the unaliased tenant predicate.
    /// </summary>
    public static string BuildPriorityRankScopeFilter(ScopeContext scope) =>
        scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND fr.TenantId = @ScopeTenantId AND fr.WorkspaceId = @ScopeWorkspaceId AND fr.ProjectId = @ScopeProjectId";
}
