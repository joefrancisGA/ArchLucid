using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

// ReSharper disable InvalidXmlDocComment
/// <summary>
///     Narrows an in-memory <see cref="ComplianceRulePack" /> using effective compliance ids/keys from policy packs.
/// </summary>
/// <remarks>
///     <para>
///         <strong>Semantics:</strong> Narrows by <see cref="PolicyPackContentDocument.ComplianceRuleKeys" /> /
///         <see cref="PolicyPackContentDocument.ComplianceRuleIds" /> when configured; then applies
///         <c>priorityFloor</c> from <see cref="PolicyPackContentDocument.AdvisoryDefaults" /> via
///         <see cref="PolicyPackPriorityFloor" /> (unset floor = <c>P2</c>, all tiers).
///     </para>
///     <para>
///         <strong>Caller:</strong> <c>ArchLucid.Persistence.Compliance.PolicyFilteredComplianceRulePackProvider</c> when
///         building packs for evaluation.
///     </para>
/// </remarks>
/// // ReSharper enable InvalidXmlDocComment
public static class ComplianceRulePackGovernanceFilter
{
    /// <summary>
    ///     Returns a new pack instance with <see cref="ComplianceRulePack.Rules" /> filtered; does not mutate
    ///     <paramref name="source" />.
    /// </summary>
    /// <param name="source">Full file-backed or merged pack before policy narrowing.</param>
    /// <param name="effective">Merged governance document for the evaluation scope.</param>
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
