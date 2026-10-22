using ArchLucid.Contracts.Compliance;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Filters compliance rules by optional applicability conditions. No-op when context is null.</summary>
public static class ComplianceRuleApplicabilityFilter
{
    public static IReadOnlyList<ComplianceRule> FilterRules(
        IReadOnlyList<ComplianceRule> rules,
        ComplianceRuleApplicabilityContext? context)
    {
        ArgumentNullException.ThrowIfNull(rules);

        if (context is null)
            return rules;

        List<ComplianceRule> filtered = [];

        foreach (ComplianceRule rule in rules)
        {
            if (IsApplicable(rule, context))
                filtered.Add(rule);
        }

        return filtered;
    }

    private static bool IsApplicable(ComplianceRule rule, ComplianceRuleApplicabilityContext context)
    {
        ComplianceRuleApplicabilityConditions? conditions = rule.Applicability;

        if (conditions is null)
            return true;

        if (conditions.CloudProviders is { Count: > 0 })
        {
            string cloudName = context.CloudProvider.ToString();

            if (!conditions.CloudProviders.Any(provider =>
                    string.Equals(provider?.Trim(), cloudName, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }
        }

        return true;
    }
}
