using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecureNowScopeGuard
{
    internal static bool Matches(
        ScopeContext scope,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return tenantId == scope.TenantId
               && workspaceId == scope.WorkspaceId
               && projectId == scope.ProjectId;
    }
}
