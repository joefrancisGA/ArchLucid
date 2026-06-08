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

    /// <summary>
    ///     Maps contract/API run id strings to <c>UNIQUEIDENTIFIER</c> parameters. Dapper sends <see cref="string" /> as
    ///     <c>NVARCHAR</c>, which SQL Server cannot always coerce into <c>UNIQUEIDENTIFIER</c> (especially <c>N</c> format).
    /// </summary>
    internal static Guid ToSqlRunId(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId.Trim(), out Guid parsed))
        {
            throw new ArgumentException(
                "Run id must parse as a GUID for SQL UNIQUEIDENTIFIER columns.",
                nameof(runId));
        }

        return parsed;
    }
}
