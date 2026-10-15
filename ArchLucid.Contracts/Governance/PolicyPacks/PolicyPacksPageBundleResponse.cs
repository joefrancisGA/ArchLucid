using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Policy packs hub: catalog rows, effective assignments, and merged content.</summary>
public sealed class PolicyPacksPageBundleResponse
{
    private IReadOnlyList<PolicyPack> packs = [];

    public IReadOnlyList<PolicyPack> Packs
    {
        get => packs;
        init => packs = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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
