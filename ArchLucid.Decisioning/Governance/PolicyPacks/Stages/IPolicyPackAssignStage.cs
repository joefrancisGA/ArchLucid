using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

public interface IPolicyPackAssignStage
{
    Task<PolicyPackAssignment> AssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        bool isOrganizationRequired = false,
        bool isEnabled = true,
        CancellationToken ct = default);

    Task<bool> TryArchiveAssignmentAsync(Guid tenantId, Guid assignmentId, CancellationToken ct);
}
