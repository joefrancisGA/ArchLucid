namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Compatibility shim; canonical implementation is <see cref="ArchLucid.Core.Governance.PolicyPacks.PolicyPackGovernanceFilter" />.</summary>
public static class PolicyPackGovernanceFilter
{
    public static List<AlertRule> FilterAlertRules(
        IReadOnlyList<AlertRule> rules,
        PolicyPackContentDocument effective)
    {
        return ArchLucid.Core.Governance.PolicyPacks.PolicyPackGovernanceFilter.FilterAlertRules(rules, effective);
    }

    public static List<CompositeAlertRule> FilterCompositeRules(
        IReadOnlyList<CompositeAlertRule> rules,
        PolicyPackContentDocument effective)
    {
        return ArchLucid.Core.Governance.PolicyPacks.PolicyPackGovernanceFilter.FilterCompositeRules(rules, effective);
    }
}
