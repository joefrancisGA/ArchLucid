using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Concrete recommendation alternatives per dimension (TB-2338 item 40).</summary>
internal static class ArchitectureRecommendationAlternatives
{
    internal static IReadOnlyList<string> Build(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Dimension == QualityDimension.Security
            && finding.Title.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
        {
            return [
                "Restrict the endpoint to private network access until authentication is documented",
                "Document authentication, authorization, and trust boundary before production exposure",
            ];
        }

        if (finding.Dimension == QualityDimension.Reliability
            && finding.Title.Contains("recovery", StringComparison.OrdinalIgnoreCase))
        {
            return [
                "Increase backup frequency or add replication to meet the stated RTO",
                "Revise the stated RTO with sponsor approval and document compensating controls",
            ];
        }

        if (finding.Dimension == QualityDimension.Cost
            && finding.Title.Contains("ceiling", StringComparison.OrdinalIgnoreCase))
        {
            return [
                "Map cost drivers to the stated ceiling with spend guardrails",
                "Revise the monthly ceiling with documented business rationale",
            ];
        }

        if (finding.Dimension == QualityDimension.DataArchitecture)
        {
            return [
                "Document data flows for sensitive data paths before production",
                "Defer sensitive data processing until classification and flows are recorded",
            ];
        }

        if (finding.Dimension == QualityDimension.PerformanceScalability)
        {
            return [
                "Add a capacity expectation that states peak load and scaling approach",
                "Reduce stated load targets until capacity design is documented",
            ];
        }

        return [
            "Defer with documented exception and compensating controls",
            "Collect additional evidence before changing the design",
        ];
    }
}
