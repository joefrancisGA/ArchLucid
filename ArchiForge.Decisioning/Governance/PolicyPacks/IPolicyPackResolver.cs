namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public interface IPolicyPackResolver
{
    Task<EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
