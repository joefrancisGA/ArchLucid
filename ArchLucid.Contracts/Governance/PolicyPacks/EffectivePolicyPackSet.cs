using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Result of policy pack resolution: every enabled applicable pack as its own entry (no merge).</summary>
public class EffectivePolicyPackSet
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    private List<ResolvedPolicyPack> packs = [];

    public List<ResolvedPolicyPack> Packs
    {
        get => packs;
        set => packs = ContractCollectionDefaults.Coalesce(value);
    }
}
