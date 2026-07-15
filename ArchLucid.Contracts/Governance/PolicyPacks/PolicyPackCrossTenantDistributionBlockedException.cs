namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Thrown when a pack's <see cref="PolicyPack.DistributionScope" /> forbids cross-tenant catalog or marketplace distribution.
/// </summary>
public sealed class PolicyPackCrossTenantDistributionBlockedException : InvalidOperationException
{
    public PolicyPackCrossTenantDistributionBlockedException(string distributionScope)
        : base(
            $"Policy packs with distribution scope '{distributionScope}' cannot be promoted to the global catalog or shared outside the owning organization.")
    {
        DistributionScope = distributionScope;
    }

    public string DistributionScope
    {
        get;
    }
}
