using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>TB-2328 — ordinal effort/risk bands without false implementation precision.</summary>
internal static class ArchitectureRecommendationEffortEstimate
{
    internal static EffortEstimate Build(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string band = ArchitectureRecommendationSeverityLabel.IsCriticalOrHigh(finding.Severity)
            ? "High"
            : "Medium";

        return new EffortEstimate
        {
            Band = band,
            BasisNotes = $"{band} architectural effort inferred from {finding.Severity} severity; implementation estimate unavailable without delivery-team and repository context.",
            ImplementationEstimateAvailable = false,
        };
    }

    internal static RiskReductionEstimate BuildRiskReduction(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string level = finding.Dimension == QualityDimension.Security
            ? "High"
            : ArchitectureRecommendationSeverityLabel.IsCriticalOrHigh(finding.Severity)
                ? "Moderate"
                : "Low";

        return new RiskReductionEstimate
        {
            Level = level,
            ScenarioNotes = $"Ordinal risk reduction if the {finding.Dimension} gap is resolved; not a calibrated numeric estimate.",
        };
    }
}
