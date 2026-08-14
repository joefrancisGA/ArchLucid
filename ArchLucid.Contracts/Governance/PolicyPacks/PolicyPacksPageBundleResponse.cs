namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Policy packs hub: catalog rows, effective assignments, and merged content.</summary>
public sealed class PolicyPacksPageBundleResponse
{
    public IReadOnlyList<PolicyPack> Packs
    {
        get;
        init;
    } = [];

    public EffectivePolicyPackSet Effective
    {
        get;
        init;
    } = new();

    public PolicyPackContentDocument EffectiveContent
    {
        get;
        init;
    } = new();
}
