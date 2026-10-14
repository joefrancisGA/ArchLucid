using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Governance setup guide: effective policy packs and alert routing subscriptions.</summary>
public sealed class GovernanceSetupGuideBundleResponse
{
    public EffectivePolicyPackSet EffectivePolicyPacks
    {
        get;
        init;
    } = new();

    private IReadOnlyList<AlertRoutingSubscription> alertRoutingSubscriptions = [];

    public IReadOnlyList<AlertRoutingSubscription> AlertRoutingSubscriptions
    {
        get => alertRoutingSubscriptions;
        init => alertRoutingSubscriptions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
