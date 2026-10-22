using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Maps validation pipeline output to honest sponsor-facing evidence tiers (TB-2340 item 46).</summary>
internal static class EvidenceSupportTierResolver
{
    internal static EvidenceSupportTier Resolve(EvidenceValidationResult validation)
    {
        ArgumentNullException.ThrowIfNull(validation);

        if (validation.OverallPassedIntegrity)
        {
            if (validation.SemanticAssessment is SemanticSupportAssessment.Supports
                or SemanticSupportAssessment.PartiallySupports)
            {
                return EvidenceSupportTier.IntegrityVerified;
            }

            return EvidenceSupportTier.SemanticInferenceFromPartialEvidence;
        }

        if (validation.SemanticAssessment is SemanticSupportAssessment.Supports
            or SemanticSupportAssessment.PartiallySupports)
        {
            return EvidenceSupportTier.SemanticInferenceFromPartialEvidence;
        }

        bool semanticStagePassed = validation.StageResults
            .Any(stage => stage.Stage == EvidenceValidationStage.SemanticSupport && stage.Passed);

        if (semanticStagePassed || validation.SemanticAssessment.HasValue)
        {
            return EvidenceSupportTier.SemanticInferenceFromPartialEvidence;
        }

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
