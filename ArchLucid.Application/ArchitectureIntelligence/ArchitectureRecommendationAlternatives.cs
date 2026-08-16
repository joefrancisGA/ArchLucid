using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Structured recommendation alternatives per dimension (TB-2350 item 41).</summary>
internal static class ArchitectureRecommendationAlternatives
{
    internal static IReadOnlyList<RecommendationAlternative> Build(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Dimension == QualityDimension.Security
            && finding.Title.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                Create(
                    "Restrict the endpoint to private network access until authentication is documented",
                    "Confirm the endpoint is unreachable from the public internet until authentication is recorded."),
                Create(
                    "Document authentication, authorization, and trust boundary before production exposure",
                    "Reviewers can point to recorded authentication, authorization, and trust-boundary evidence."),
            ];
        }

        if (finding.Dimension == QualityDimension.Reliability
            && finding.Title.Contains("recovery", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                Create(
                    "Increase backup frequency or add replication to meet the stated RTO",
                    "Measured restore or failover time meets the stated recovery objective."),
                Create(
                    "Revise the stated RTO with sponsor approval and document compensating controls",
                    "Sponsor-approved RTO and compensating controls are recorded in the architecture package."),
            ];
        }

        if (finding.Dimension == QualityDimension.Cost
            && finding.Title.Contains("ceiling", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                Create(
                    "Map cost drivers to the stated ceiling with spend guardrails",
                    "Each cost driver has a guardrail that keeps spend within the stated ceiling."),
                Create(
                    "Revise the monthly ceiling with documented business rationale",
                    "The revised ceiling and business rationale are recorded and approved."),
            ];
        }

        if (finding.Dimension == QualityDimension.DataArchitecture)
        {
            return
            [
                Create(
                    "Document data flows for sensitive data paths before production",
                    "Sensitive-data flows are recorded from source to sink before production processing."),
                Create(
                    "Defer sensitive data processing until classification and flows are recorded",
                    "No sensitive data is processed until classification and flow records exist."),
            ];
        }

        if (finding.Dimension == QualityDimension.PerformanceScalability)
        {
            return
            [
                Create(
                    "Add a capacity expectation that states peak load and scaling approach",
                    "Peak load and scaling approach are recorded as a capacity expectation."),
                Create(
                    "Reduce stated load targets until capacity design is documented",
                    "Load targets match documented capacity, or capacity design is recorded first."),
            ];
        }

        return
        [
            Create(
                "Defer with documented exception and compensating controls",
                "The exception, compensating controls, and expiry are recorded in the architecture package."),
            Create(
                "Collect additional evidence before changing the design",
                "New evidence artifacts are attached and the finding is re-reviewed before the design changes."),
        ];
    }

    private static RecommendationAlternative Create(string path, string validationCriteria)
    {
        return new RecommendationAlternative
        {
            Path = path,
            ValidationCriteria = validationCriteria,
        };
    }
}
