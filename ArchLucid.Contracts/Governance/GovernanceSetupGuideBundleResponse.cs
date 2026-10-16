using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Governance setup guide: effective policy packs and alert routing subscriptions.</summary>
public sealed class GovernanceSetupGuideBundleResponse
{
    private EffectivePolicyPackSet effectivePolicyPacks = new();

    public EffectivePolicyPackSet EffectivePolicyPacks
    {
        get => effectivePolicyPacks;
        init => effectivePolicyPacks = value ?? new EffectivePolicyPackSet();
    }

    private IReadOnlyList<AlertRoutingSubscription> alertRoutingSubscriptions = [];

    public IReadOnlyList<AlertRoutingSubscription> AlertRoutingSubscriptions
    {
        get => alertRoutingSubscriptions;
        init => alertRoutingSubscriptions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
