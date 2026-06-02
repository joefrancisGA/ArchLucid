using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Shared SQL predicates for run-child tables (TB-076): join <c>dbo.Runs</c> so reads cannot cross tenant/workspace/project.
/// </summary>
internal static class RunChildRunScopeSql
{
    internal const string RunsAlias = "run_scope";

    internal static string InnerJoinRuns(string childTableAlias, string childRunIdColumn = "RunId") =>
        $"INNER JOIN dbo.Runs {RunsAlias} ON {RunsAlias}.RunId = {childTableAlias}.{childRunIdColumn} AND {RunsAlias}.ArchivedUtc IS NULL";

    internal static string ScopeWhereClause =>
        $"{RunsAlias}.TenantId = @TenantId AND {RunsAlias}.WorkspaceId = @WorkspaceId AND {RunsAlias}.ScopeProjectId = @ScopeProjectId";

    internal static object ScopeParameters(ScopeContext scope) =>
        new
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

    internal static void RequireScope(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
            throw new InvalidOperationException(
                "ScopeContext.TenantId must be set for scoped run-child repository reads.");
    }
}
