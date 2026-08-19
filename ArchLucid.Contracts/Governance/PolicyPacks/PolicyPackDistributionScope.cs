namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Who may see or install a policy pack — separate from <see cref="PolicyPack.PackType" /> (authorship origin).
/// </summary>
public static class PolicyPackDistributionScope
{
    /// <summary>ArchLucid-built-in or platform-default bundles distributed with the product.</summary>
    public const string Platform = "Platform";

    /// <summary>Customer-authored pack visible only inside the owning organization (tenant).</summary>
    public const string OrganizationPrivate = "OrganizationPrivate";

    /// <summary>Reserved for a future multi-tenant holdings share model — not implemented in V1.</summary>
    public const string OrganizationShared = "OrganizationShared";

    /// <summary>Reserved for a future public marketplace — not implemented in V1.</summary>
    public const string Marketplace = "Marketplace";
}
