using ArchLucid.Contracts.Compliance;

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
        return ArchLucid.Core.Governance.PolicyPacks.ComplianceRulePackGovernanceFilter.Filter(source, effective);
    }
}
