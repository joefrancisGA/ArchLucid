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

    /// <summary>
    ///     Triple-scope clause qualified with a table alias so JOIN queries stay unambiguous.
    ///     The analyzer recognizes this method by name.
    /// </summary>
    internal static string AndTripleWhere(ScopeContext scope, string tableAlias)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tableAlias);

        return scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND " + tableAlias + ".TenantId = @ScopeTenantId AND " + tableAlias
              + ".WorkspaceId = @ScopeWorkspaceId AND " + tableAlias + ".ProjectId = @ScopeProjectId";
    }

    internal static string AndProjectIdTripleWhere(ScopeContext scope) =>
        RepositoryScopePredicate.AndProjectIdTripleWhere(scope);

    internal static string AndScopeProjectIdTripleWhere(ScopeContext scope) =>
        RepositoryScopePredicate.AndScopeProjectIdTripleWhere(scope);

    /// <summary>
    ///     Tenant predicate that no-ops when <c>@TenantId</c> is <see cref="Guid.Empty"/> (trusted jobs / tests).
    ///     Combined with another AND this satisfies ARCH006 without filtering workspace/project.
    /// </summary>
    internal const string AndTenantIdOrTrustedJob =
        " AND (@TenantId = @EmptyTenantId OR TenantId = @TenantId)";

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

    /// <summary>Trusted jobs (backfill, migration) skip repository scope predicates when tenant is empty.</summary>
    internal static ScopeContext TrustedJobScope => ScopedRepositoryScopeValidation.TrustedJobScope;
}
