using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Fail-closed validation for leader-elected Executive ROI background jobs before tenant-scoped SQL runs.
/// </summary>
public static class ExecutiveRoiBackgroundScopeGuard
{
    /// <summary>
    ///     Returns <see langword="false" /> when scope is incomplete or still the dev default triple (ambient override missing).
    /// </summary>
    public static bool TryValidate(ScopeContext scope, out string reason)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
        {
            reason = "tenant_id_empty";
            return false;
        }

        if (scope.WorkspaceId == Guid.Empty)
        {
            reason = "workspace_id_empty";
            return false;
        }

        if (scope.ProjectId == Guid.Empty)
        {
            reason = "project_id_empty";
            return false;
        }

        if (scope.TenantId == ScopeIds.DefaultTenant
            && scope.WorkspaceId == ScopeIds.DefaultWorkspace
            && scope.ProjectId == ScopeIds.DefaultProject)
        {
            reason = "dev_default_scope_triple";
            return false;
        }

        reason = string.Empty;
        return true;
    }
}
