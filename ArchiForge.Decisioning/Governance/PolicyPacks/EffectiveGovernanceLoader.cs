using ArchiForge.Decisioning.Governance.Resolution;

namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public sealed class EffectiveGovernanceLoader(IEffectiveGovernanceResolver resolver) : IEffectiveGovernanceLoader
{
    public async Task<PolicyPackContentDocument> LoadEffectiveContentAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        var result = await resolver
            .ResolveAsync(tenantId, workspaceId, projectId, ct)
            .ConfigureAwait(false);

        return result.EffectiveContent;
    }
}
