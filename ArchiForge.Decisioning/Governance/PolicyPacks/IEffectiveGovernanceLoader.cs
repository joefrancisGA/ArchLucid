namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public interface IEffectiveGovernanceLoader
{
    Task<PolicyPackContentDocument> LoadEffectiveContentAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
