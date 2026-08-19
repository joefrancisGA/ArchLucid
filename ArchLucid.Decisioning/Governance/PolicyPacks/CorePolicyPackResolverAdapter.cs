using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Forwards <see cref="ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver" /> to the Decisioning compatibility port.</summary>
public sealed class CorePolicyPackResolverAdapter(ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver inner)
    : IPolicyPackResolver
{
    private readonly ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        return _inner.ResolveAsync(tenantId, workspaceId, projectId, ct);
    }
}
