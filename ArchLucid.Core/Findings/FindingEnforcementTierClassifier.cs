using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Assigns <see cref="FindingEnforcementTier" /> so baseline guidance stays available without blocking governance.
/// </summary>
public static class FindingEnforcementTierClassifier
{
    /// <summary>Classifies a live agent finding before persistence.</summary>
    public static FindingEnforcementTier ClassifyArchitectureFinding(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (StandardBaselinePolicyRuleIdPrefixes.IsStandardBaseline(finding.PolicyRuleId))
            return FindingEnforcementTier.Advisory;

        if (IsGenericAdvisoryArchitectureFinding(finding))
            return FindingEnforcementTier.Advisory;

        return FindingEnforcementTier.PolicyViolation;
    }

    /// <summary>Applies tier to an agent finding and mirrors it on the wire object.</summary>
    public static void ApplyToArchitectureFinding(ArchitectureFinding finding)
    {
        finding.EnforcementTier = ClassifyArchitectureFinding(finding);
    }

    /// <summary>Classifies a persisted decisioning finding.</summary>
    public static FindingEnforcementTier ClassifyFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (TryReadTierFromProperties(finding.Properties, out FindingEnforcementTier tierFromProperties))
            return tierFromProperties;

        if (StandardBaselinePolicyRuleIdPrefixes.IsStandardBaseline(finding.PolicyRuleId))
            return FindingEnforcementTier.Advisory;

        if (IsPolicyCoverageAdvisoryFinding(finding))
            return FindingEnforcementTier.Advisory;

        if (IsGenericAdvisoryPersistedFinding(finding))
            return FindingEnforcementTier.Advisory;

        return FindingEnforcementTier.PolicyViolation;
    }

    /// <summary>Applies tier to a persisted finding and stores it in <see cref="Finding.Properties" />.</summary>
    public static void ApplyToFinding(Finding finding)
    {
        FindingEnforcementTier tier = ClassifyFinding(finding);
        finding.EnforcementTier = tier;
        finding.Properties[FindingPropertyKeys.EnforcementTier] = tier.ToString();
    }

    private static bool IsGenericAdvisoryArchitectureFinding(ArchitectureFinding finding)
    {
        if (!GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(finding.Message))
            return false;

        return !GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(finding.Message, finding.EvidenceRefs);
    }

    private static bool IsPolicyCoverageAdvisoryFinding(Finding finding)
    {
        return string.Equals(finding.FindingType, "PolicyCoverageFinding", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsGenericAdvisoryPersistedFinding(Finding finding)
    {
        if (!GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(finding.Title) &&
            !GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(finding.Rationale))
        {
            return false;
        }

        List<string> evidenceRefs = finding.Trace.Notes
            .Where(static note => note.StartsWith("evidence:", StringComparison.OrdinalIgnoreCase))
            .Select(static note => note["evidence:".Length..])
            .ToList();

        string message = string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Title : finding.Rationale;

        return !GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(message, evidenceRefs);
    }

    private static bool TryReadTierFromProperties(
        IReadOnlyDictionary<string, string> properties,
        out FindingEnforcementTier tier)
    {
        tier = FindingEnforcementTier.PolicyViolation;

        if (!properties.TryGetValue(FindingPropertyKeys.EnforcementTier, out string? raw) ||
            string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        return Enum.TryParse(raw, ignoreCase: true, out tier);
    }
}
