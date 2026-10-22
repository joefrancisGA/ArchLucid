using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Governance.PolicyPacks;

public static class PolicyPackGovernanceFilter
{
    public static List<AlertRule> FilterAlertRules(
        IReadOnlyList<AlertRule> rules,
        PolicyPackContentDocument effective)
    {
        if (effective.AlertRuleIds.Count == 0)
            return rules.ToList();

        HashSet<Guid> allow = effective.AlertRuleIds.ToHashSet();
        return rules.Where(r => allow.Contains(r.RuleId)).ToList();
    }

    public static List<CompositeAlertRule> FilterCompositeRules(
        IReadOnlyList<CompositeAlertRule> rules,
        PolicyPackContentDocument effective)
    {
        if (effective.CompositeAlertRuleIds.Count == 0)
            return rules.ToList();

        HashSet<Guid> allow = effective.CompositeAlertRuleIds.ToHashSet();
        return rules.Where(r => allow.Contains(r.CompositeRuleId)).ToList();
    }
}
