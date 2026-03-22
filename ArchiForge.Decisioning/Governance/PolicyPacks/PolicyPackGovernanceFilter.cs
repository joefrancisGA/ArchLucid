using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;

namespace ArchiForge.Decisioning.Governance.PolicyPacks;

/// <summary>
/// Optional filtering: when effective policy content lists rule IDs, restrict evaluation to that set.
/// Empty ID lists mean "no pack filter" (legacy behavior).
/// </summary>
public static class PolicyPackGovernanceFilter
{
    public static List<AlertRule> FilterAlertRules(
        IReadOnlyList<AlertRule> rules,
        PolicyPackContentDocument effective)
    {
        if (effective.AlertRuleIds.Count == 0)
            return rules.ToList();

        var allow = effective.AlertRuleIds.ToHashSet();
        return rules.Where(r => allow.Contains(r.RuleId)).ToList();
    }

    public static List<CompositeAlertRule> FilterCompositeRules(
        IReadOnlyList<CompositeAlertRule> rules,
        PolicyPackContentDocument effective)
    {
        if (effective.CompositeAlertRuleIds.Count == 0)
            return rules.ToList();

        var allow = effective.CompositeAlertRuleIds.ToHashSet();
        return rules.Where(r => allow.Contains(r.CompositeRuleId)).ToList();
    }
}
