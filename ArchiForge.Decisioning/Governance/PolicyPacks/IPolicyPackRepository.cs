namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public interface IPolicyPackRepository
{
    Task CreateAsync(PolicyPack pack, CancellationToken ct);
    Task UpdateAsync(PolicyPack pack, CancellationToken ct);
    Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct);

    Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
