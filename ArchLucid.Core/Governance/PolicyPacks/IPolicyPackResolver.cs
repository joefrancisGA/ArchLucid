using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

public interface IPolicyPackResolver
{
    Task<EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
