using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Optional tenant/workspace/project equality clause for Dapper commands when
///     <see cref="IScopeContextProvider" /> returns a non-empty tenant (empty scope skips the clause for trusted jobs).
/// </summary>
internal static class RepositoryScopePredicate
{
    internal static string AndTripleWhere(ScopeContext scope)
    {
        return scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND TenantId = @ScopeTenantId AND WorkspaceId = @ScopeWorkspaceId AND ProjectId = @ScopeProjectId";
    }

    internal static void AddScopeTripleIfNeeded(DynamicParameters parameters, ScopeContext scope)
    {
        if (scope.TenantId == Guid.Empty)
            return;

        parameters.Add("ScopeTenantId", scope.TenantId);
        parameters.Add("ScopeWorkspaceId", scope.WorkspaceId);
        parameters.Add("ScopeProjectId", scope.ProjectId);
    }

    /// <summary>Scope filter for tables that denormalize project as <c>ProjectId</c> (e.g. <c>FindingsSnapshots</c>).</summary>
    internal static string AndProjectIdTripleWhere(ScopeContext scope) =>
        scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND TenantId = @ScopeTenantId AND WorkspaceId = @ScopeWorkspaceId AND ProjectId = @ScopeProjectId";

    /// <summary>Scope filter for tables that denormalize project as <c>ScopeProjectId</c>.</summary>
    internal static string AndScopeProjectIdTripleWhere(ScopeContext scope) =>
        scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND TenantId = @ScopeTenantId AND WorkspaceId = @ScopeWorkspaceId AND ScopeProjectId = @ScopeProjectId";
}
