using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static partial class ClosedLoopReasoningResultCloner
{
    private static SpecialistReviewResult CloneSpecialistReview(SpecialistReviewResult review)
    {
        return new SpecialistReviewResult
        {
            Dimension = review.Dimension,
            Findings = review.Findings.Select(CloneFinding).ToList(),
            OpenQuestions = review.OpenQuestions.ToList(),
        };
    }

    private static SpecialistReviewFinding CloneFinding(SpecialistReviewFinding finding)
    {
        return new SpecialistReviewFinding
        {
            FindingId = finding.FindingId,
            Dimension = finding.Dimension,
            Title = finding.Title,
            Rationale = finding.Rationale,
            Conclusion = finding.Conclusion,
            EvidenceCondition = finding.EvidenceCondition,
            GovernanceDisposition = finding.GovernanceDisposition,
            Provenance = ArchitectureKnowledgeModelCloner.CloneProvenance(finding.Provenance),
            Confidence = finding.Confidence,
            EvidenceArtifactIds = finding.EvidenceArtifactIds.ToList(),
            Severity = finding.Severity,
            LifecycleScope = finding.LifecycleScope,
            RelatedModelElementIds = finding.RelatedModelElementIds.ToList(),
            RelatedRequirementElementIds = finding.RelatedRequirementElementIds.ToList(),
            RelatedDecisionElementIds = finding.RelatedDecisionElementIds.ToList(),
            EvidenceSupportTier = finding.EvidenceSupportTier,
        };
    }

    private static AdversarialReviewResult CloneAdversarial(AdversarialReviewResult adversarial)
    {
        return new AdversarialReviewResult
        {
            SubstantiatedFindings = adversarial.SubstantiatedFindings.Select(CloneFinding).ToList(),
            Challenges = adversarial.Challenges.Select(CloneAdversarialChallenge).ToList(),
            FalsePositiveRateByLane = new Dictionary<AdversarialLane, double>(adversarial.FalsePositiveRateByLane),
        };
    }

    private static AdversarialChallenge CloneAdversarialChallenge(AdversarialChallenge challenge)
    {
        return new AdversarialChallenge
        {
            ChallengeId = challenge.ChallengeId,
            Hypothesis = challenge.Hypothesis,
            FalsificationEvidenceNeeded = challenge.FalsificationEvidenceNeeded,
            Confidence = challenge.Confidence,
            Lane = challenge.Lane,
            Suppressed = challenge.Suppressed,
            SuppressionReason = challenge.SuppressionReason,
            SourceFindingId = challenge.SourceFindingId,
        };
    }
}
