using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Structured recommendation alternatives per dimension (TB-2350 item 41).</summary>
internal static class ArchitectureRecommendationAlternatives
{
    internal static IReadOnlyList<RecommendationAlternative> Build(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (ProvenancePresentationMapper.MapFinding(finding) == ProvenancePresentationBucket.Unverified)
        {
            return BuildEvidenceFirstAlternatives();
        }

        if (finding.Dimension == QualityDimension.Security
            && finding.Title.Contains("public", StringComparison.OrdinalIgnoreCase)
            && finding.Title.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                Create(
                    "Restrict the endpoint to private network access until authentication is documented",
                    "Confirm the endpoint is unreachable from the public internet until authentication is recorded."),
                // Distinct from ProposedChange (document trust boundary + auth before production).
                Create(
                    "Place the public endpoint behind an API gateway that enforces authentication and authorization centrally",
                    "Gateway policies deny unauthenticated requests and record the enforced trust boundary."),
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
                // Distinct from ProposedChange (map drivers + guardrails or revise ceiling).
                Create(
                    "Apply service-level spend caps and alerts without changing architecture cost drivers",
                    "Spend caps and alerts enforce the stated ceiling without unmapped driver growth."),
                Create(
                    "Revise the monthly ceiling with documented business rationale",
                    "The revised ceiling and business rationale are recorded and approved."),
            ];
        }

        if (finding.Dimension == QualityDimension.DataArchitecture)
        {
            return
            [
                // Distinct from ProposedChange (document flows, classification, and storage boundaries).
                Create(
                    "Record data classification and retention boundaries before expanding production data processing",
                    "Classification and retention boundaries are recorded before new sensitive processing begins."),
                Create(
                    "Defer sensitive data processing until classification and flows are recorded",
                    "No sensitive data is processed until classification and flow records exist."),
            ];
        }

        if (finding.Dimension == QualityDimension.PerformanceScalability)
        {
            return
            [
                // Distinct from ProposedChange (record capacity expectation with peak load and scaling).
                Create(
                    "Implement autoscaling and documented load tests before accepting peak production traffic",
                    "Load tests prove the design meets peak traffic before production cutover."),
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

    private static IReadOnlyList<RecommendationAlternative> BuildEvidenceFirstAlternatives()
    {
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
