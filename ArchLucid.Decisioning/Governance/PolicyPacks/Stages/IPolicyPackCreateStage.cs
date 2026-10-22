using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

public interface IPolicyPackCreateStage
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
}
