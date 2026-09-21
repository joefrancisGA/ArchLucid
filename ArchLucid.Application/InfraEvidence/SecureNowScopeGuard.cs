using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecureNowScopeGuard
{
    internal static bool Matches(
        ScopeContext scope,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId) =>
        scope.ToProjectScopeKey().Matches(tenantId, workspaceId, projectId);
}
