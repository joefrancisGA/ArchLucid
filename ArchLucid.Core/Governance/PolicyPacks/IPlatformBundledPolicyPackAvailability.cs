using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Whether a bundled platform pack is globally available to tenants.</summary>
public interface IPlatformBundledPolicyPackAvailability
{
    ValueTask<bool> IsGloballyActiveAsync(PolicyPack pack, CancellationToken ct);

    void InvalidateCache();
}
