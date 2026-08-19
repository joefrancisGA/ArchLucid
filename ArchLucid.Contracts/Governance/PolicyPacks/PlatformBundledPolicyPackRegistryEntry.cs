namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>One bundled policy pack row in the platform activation registry.</summary>
public sealed class PlatformBundledPolicyPackRegistryEntry
{
    public string BundleContentFile
    {
        get;
        set;
    } = null!;

    public string DisplayName
    {
        get;
        set;
    } = null!;

    public bool IsGloballyActive
    {
        get;
        set;
    } = true;

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
