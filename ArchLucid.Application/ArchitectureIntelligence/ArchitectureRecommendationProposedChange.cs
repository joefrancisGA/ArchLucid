using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>TB-2328 — concrete proposed changes instead of template "Address finding" copy.</summary>
internal static class ArchitectureRecommendationProposedChange
{
    internal static string Build(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string title = (finding.Title ?? string.Empty).Trim();
        string titleLower = title.ToLowerInvariant();

        if (finding.Dimension == QualityDimension.Security
            && titleLower.Contains("public", StringComparison.Ordinal)
            && titleLower.Contains("trust boundary", StringComparison.Ordinal))
        {
            return "Document a trust boundary for the public endpoint and require authentication and authorization before production exposure.";
        }

        if (finding.Dimension == QualityDimension.Reliability
            && titleLower.Contains("recovery", StringComparison.Ordinal))
        {
            return "Align backup, replication, or failover with the stated RTO and record a recovery test that proves the objective.";
        }

        if (finding.Dimension == QualityDimension.Cost
            && titleLower.Contains("ceiling", StringComparison.Ordinal))
        {
            return "Map primary cost drivers to the stated monthly ceiling and add spend guardrails or revise the ceiling with rationale.";
        }

        if (finding.Dimension == QualityDimension.Security)
        {
            return $"Close the security gap ({title}) with a documented control, owner, and validation step.";
        }

        if (finding.Dimension == QualityDimension.Reliability)
        {
            return $"Resolve the reliability gap ({title}) with a design change and recovery validation.";
        }

        if (finding.Dimension == QualityDimension.Cost)
        {
            return $"Address the cost exposure ({title}) with a concrete spend or architecture change.";
        }

        if (finding.Dimension == QualityDimension.DataArchitecture)
        {
            return "Document data flows for sensitive data paths, classification, and storage boundaries.";
        }

        if (finding.Dimension == QualityDimension.PerformanceScalability)
        {
            return "Record a capacity expectation that states peak load and how the design scales to meet it.";
        }

        if (finding.Dimension == QualityDimension.PrivacyCompliance)
        {
            return "Record compliance obligations and jurisdiction controls that apply to this architecture.";
        }

        if (finding.Dimension == QualityDimension.Integration)
        {
            return "Document external interfaces, authentication, and failure handling for third-party dependencies.";
        }

        return $"Implement a concrete design change to resolve: {title}.";
    }

    internal static string BuildConsequence(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return $"If unchanged, {finding.Dimension} risk from \"{finding.Title}\" may remain open for production decisions.";
    }

    internal static string BuildValidationMethod(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Dimension == QualityDimension.Reliability)
        {
            return "Re-run reliability review after updating recovery design and recording a recovery test.";
        }

        if (finding.Dimension == QualityDimension.Security)
        {
            return "Re-run security review after trust-boundary and access-control updates are documented.";
        }

        if (finding.Dimension == QualityDimension.Cost)
        {
            return "Re-run cost review after cost drivers are mapped to the stated ceiling.";
        }

        return "Re-run specialist review after the proposed change is applied to the architecture model.";
    }
}
