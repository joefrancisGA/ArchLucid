using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Test/default implementation — all packs globally active.</summary>
public sealed class NullPlatformBundledPolicyPackAvailability : IPlatformBundledPolicyPackAvailability
{
    public static readonly NullPlatformBundledPolicyPackAvailability Instance = new();

    public ValueTask<bool> IsGloballyActiveAsync(PolicyPack pack, CancellationToken ct) => ValueTask.FromResult(true);
}
