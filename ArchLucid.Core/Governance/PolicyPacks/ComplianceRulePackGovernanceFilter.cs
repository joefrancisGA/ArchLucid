using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Governance.PolicyPacks;

public static class ComplianceRulePackGovernanceFilter
{
    public static ComplianceRulePack Filter(ComplianceRulePack source, PolicyPackContentDocument effective) =>
        Filter(source, effective, applicabilityContext: null);

    public static ComplianceRulePack Filter(
        ComplianceRulePack source,
        PolicyPackContentDocument effective,
        ComplianceRuleApplicabilityContext? applicabilityContext)
    {
        if (effective.ComplianceRuleIds.Count == 0 && effective.ComplianceRuleKeys.Count == 0)
            return WithPriorityFloor(source, source.Rules, effective, applicabilityContext);

        HashSet<string> keySet = effective.ComplianceRuleKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<Guid> guidSet = effective.ComplianceRuleIds.ToHashSet();

        List<ComplianceRule> rules = source.Rules
            .Where(r => keySet.Contains(r.RuleId) ||
                        (Guid.TryParse(r.RuleId, out Guid g) && guidSet.Contains(g)))
            .ToList();

        return WithPriorityFloor(source, rules, effective, applicabilityContext);
    }

    private static ComplianceRulePack WithPriorityFloor(
        ComplianceRulePack source,
        List<ComplianceRule> rules,
        PolicyPackContentDocument effective,
        ComplianceRuleApplicabilityContext? applicabilityContext)
    {
        IReadOnlyList<ComplianceRule> applicabilityFiltered =
            ComplianceRuleApplicabilityFilter.FilterRules(rules, applicabilityContext);
        string floor = PolicyPackPriorityFloor.ResolveFloor(effective);
        IReadOnlyList<ComplianceRule> tierFiltered = PolicyPackPriorityFloor.FilterRules(applicabilityFiltered, floor);

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
