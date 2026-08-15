using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Contracts.Governance;

/// <summary>Governance setup guide: effective policy packs and alert routing subscriptions.</summary>
public sealed class GovernanceSetupGuideBundleResponse
{
    public EffectivePolicyPackSet EffectivePolicyPacks
    {
        get;
        init;
    } = new();

    public IReadOnlyList<AlertRoutingSubscription> AlertRoutingSubscriptions
    {
        get;
        init;
    } = [];
}
