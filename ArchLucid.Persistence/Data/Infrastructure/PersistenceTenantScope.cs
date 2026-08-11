using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Single entry point for tenant/workspace/project scope helpers.
///     It preserves the existing inline-predicate and run-child-join SQL shapes,
///     which use different column and parameter conventions.
/// </summary>
internal static class PersistenceTenantScope
{
    internal static string AndTripleWhere(ScopeContext scope) =>
        RepositoryScopePredicate.AndTripleWhere(scope);

    internal static string AndProjectIdTripleWhere(ScopeContext scope) =>
        RepositoryScopePredicate.AndProjectIdTripleWhere(scope);

    internal static string AndScopeProjectIdTripleWhere(ScopeContext scope) =>
        RepositoryScopePredicate.AndScopeProjectIdTripleWhere(scope);

    internal static void AddScopeTripleIfNeeded(DynamicParameters parameters, ScopeContext scope) =>
        RepositoryScopePredicate.AddScopeTripleIfNeeded(parameters, scope);

    internal static string InnerJoinRuns(string childTableAlias, string childRunIdColumn = "RunId") =>
        RunChildRunScopeSql.InnerJoinRuns(childTableAlias, childRunIdColumn);

    internal static string RunChildScopeWhereClause => RunChildRunScopeSql.ScopeWhereClause;

    internal static object RunChildScopeParameters(ScopeContext scope) =>
        RunChildRunScopeSql.ScopeParameters(scope);

    internal static void RequireRunChildScope(ScopeContext scope) =>
        RunChildRunScopeSql.RequireScope(scope);

    internal static void RequireScopedTenant(ScopeContext scope) =>
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

    internal static void RequireEntityTenant(Guid tenantId) =>
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);
}
