using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Visibility of persisted policy pack rows against ambient tenant/workspace/project scope.</summary>
public static class PolicyPackVisibility
{
    public static bool IsVisibleInScope(
        PolicyPack pack,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(pack);

        return pack.TenantId == tenantId
            && pack.WorkspaceId == workspaceId
            && pack.ProjectId == projectId;
    }
}
