namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public interface IPolicyPackManagementService
{
    Task<PolicyPack> CreatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct);

    Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct);

    Task<PolicyPackAssignment> AssignAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        CancellationToken ct);
}
