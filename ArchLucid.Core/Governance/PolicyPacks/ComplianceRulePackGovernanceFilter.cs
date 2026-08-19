using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Governance.PolicyPacks;

public static class ComplianceRulePackGovernanceFilter
{
    public static ComplianceRulePack Filter(ComplianceRulePack source, PolicyPackContentDocument effective)
    {
        if (effective.ComplianceRuleIds.Count == 0 && effective.ComplianceRuleKeys.Count == 0)
            return WithPriorityFloor(source, source.Rules, effective);

        HashSet<string> keySet = effective.ComplianceRuleKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<Guid> guidSet = effective.ComplianceRuleIds.ToHashSet();

        List<ComplianceRule> rules = source.Rules
            .Where(r => keySet.Contains(r.RuleId) ||
                        (Guid.TryParse(r.RuleId, out Guid g) && guidSet.Contains(g)))
            .ToList();

        return WithPriorityFloor(source, rules, effective);
    }

    private static ComplianceRulePack WithPriorityFloor(
        ComplianceRulePack source,
        List<ComplianceRule> rules,
        PolicyPackContentDocument effective)
    {
        string floor = PolicyPackPriorityFloor.ResolveFloor(effective);
        IReadOnlyList<ComplianceRule> tierFiltered = PolicyPackPriorityFloor.FilterRules(rules, floor);

        return new ComplianceRulePack
        {
            RulePackId = source.RulePackId,
            Name = source.Name,
            Version = source.Version,
            RulePackHash = source.RulePackHash,
            SourcePath = source.SourcePath,
            Rules = tierFiltered.ToList(),
        };
    }
}
