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

    private EffectivePolicyPackSet effective = new();

    public EffectivePolicyPackSet Effective
    {
        get => effective;
        init => effective = value ?? new EffectivePolicyPackSet();
    }

    private PolicyPackContentDocument effectiveContent = new();

    public PolicyPackContentDocument EffectiveContent
    {
        get => effectiveContent;
        init => effectiveContent = value ?? new PolicyPackContentDocument();
    }
}
