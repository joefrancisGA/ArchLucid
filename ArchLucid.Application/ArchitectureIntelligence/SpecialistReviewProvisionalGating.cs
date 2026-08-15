using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class SpecialistReviewProvisionalGating
{
    private const string ProvisionalRationaleSuffix =
        " Provisional until framing questions are answered; Fail was held as Indeterminate.";

    public static void ApplyWhileFramingIncomplete(IReadOnlyList<SpecialistReviewResult> specialistReviews)
    {
        ArgumentNullException.ThrowIfNull(specialistReviews);

        foreach (SpecialistReviewResult review in specialistReviews)
        {
            for (int index = 0; index < review.Findings.Count; index++)
            {
                SpecialistReviewFinding finding = review.Findings[index];

                if (finding.Conclusion != ReviewConclusion.Fail)
                {
                    continue;
                }

                review.Findings[index] = DowngradeFailToIndeterminate(finding);
            }
        }
    }

    private static SpecialistReviewFinding DowngradeFailToIndeterminate(SpecialistReviewFinding finding)
    {
        return new SpecialistReviewFinding
        {
            FindingId = finding.FindingId,
            Dimension = finding.Dimension,
            Title = finding.Title,
            Rationale = finding.Rationale + ProvisionalRationaleSuffix,
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = finding.EvidenceCondition,
            GovernanceDisposition = finding.GovernanceDisposition,
            Provenance = finding.Provenance,
            Confidence = finding.Confidence,
            EvidenceArtifactIds = finding.EvidenceArtifactIds.ToList(),
            Severity = finding.Severity,
        };
    }
}
