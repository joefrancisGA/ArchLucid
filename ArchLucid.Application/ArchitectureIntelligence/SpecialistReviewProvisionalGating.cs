using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class SpecialistReviewProvisionalGating
{
    private const string FailProvisionalRationaleSuffix =
        " Provisional until framing questions are answered; Fail was held as Indeterminate.";

    private const string ConstraintPassProvisionalRationaleSuffix =
        " Held as Indeterminate until L0 framing answers declare recovery/cost constraints.";

    public static void ApplyWhileFramingIncomplete(IReadOnlyList<SpecialistReviewResult> specialistReviews)
    {
        ArgumentNullException.ThrowIfNull(specialistReviews);

        foreach (SpecialistReviewResult review in specialistReviews)
        {
            for (int index = 0; index < review.Findings.Count; index++)
            {
                SpecialistReviewFinding finding = review.Findings[index];

                if (finding.Conclusion == ReviewConclusion.Fail)
                {
                    review.Findings[index] = DowngradeToIndeterminate(finding, FailProvisionalRationaleSuffix);
                    continue;
                }

                if (finding.Conclusion == ReviewConclusion.Pass && IsConstraintAdequacyPass(finding))
                {
                    review.Findings[index] = DowngradeToIndeterminate(
                        finding,
                        ConstraintPassProvisionalRationaleSuffix);
                }
            }
        }
    }

    private static bool IsConstraintAdequacyPass(SpecialistReviewFinding finding)
    {
        if (finding.Dimension == QualityDimension.Reliability)
        {
            return finding.Title.Contains("adequate", StringComparison.OrdinalIgnoreCase);
        }

        if (finding.Dimension == QualityDimension.Cost)
        {
            return finding.Title.Contains("align", StringComparison.OrdinalIgnoreCase)
                || finding.Rationale.Contains(
                    "no stated monthly cost ceiling",
                    StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static SpecialistReviewFinding DowngradeToIndeterminate(
        SpecialistReviewFinding finding,
        string rationaleSuffix)
    {
        return new SpecialistReviewFinding
        {
            FindingId = finding.FindingId,
            Dimension = finding.Dimension,
            Title = finding.Title,
            Rationale = finding.Rationale + rationaleSuffix,
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = finding.EvidenceCondition,
            GovernanceDisposition = finding.GovernanceDisposition,
            Provenance = finding.Provenance,
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
}
