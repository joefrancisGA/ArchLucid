using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Maps validation pipeline output to honest sponsor-facing evidence tiers (TB-2340 item 46).</summary>
internal static class EvidenceSupportTierResolver
{
    // Eligibility for further review. Semantic support alone is not independent factual verification.
    internal static HashSet<string> SupportedFindingIds(IReadOnlyList<EvidenceValidationResult> results) =>
        results.GroupBy(result => result.FindingId, StringComparer.Ordinal)
            .Where(group => group.All(result => result.OverallPassedIntegrity &&
                result.SemanticAssessment == SemanticSupportAssessment.Supports))
            .Select(group => group.Key)
            .ToHashSet(StringComparer.Ordinal);

    internal static EvidenceSupportTier Resolve(EvidenceValidationResult validation)
    {
        ArgumentNullException.ThrowIfNull(validation);

        if (validation.OverallPassedIntegrity && validation.SemanticAssessment == SemanticSupportAssessment.Supports)
            return EvidenceSupportTier.IntegrityVerified;

        if (validation.SemanticAssessment is SemanticSupportAssessment.Supports or SemanticSupportAssessment.PartiallySupports)
            return EvidenceSupportTier.SemanticInferenceFromPartialEvidence;

        return EvidenceSupportTier.Unverified;
    }

    internal static void ApplyToFinding(SpecialistReviewFinding finding, EvidenceValidationResult validation)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(validation);

        EvidenceSupportTier tier = Resolve(validation);
        finding.EvidenceSupportTier = tier;

        if (tier == EvidenceSupportTier.IntegrityVerified)
        {
            finding.EvidenceCondition = EvidenceCondition.Sufficient;
            return;
        }

        if (tier == EvidenceSupportTier.SemanticInferenceFromPartialEvidence)
        {
            finding.EvidenceCondition = EvidenceCondition.Unverified;
            return;
        }

        finding.EvidenceCondition = EvidenceCondition.Insufficient;
    }
}
