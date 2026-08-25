using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Adjoint map from authority <see cref="Finding" /> rows back to <see cref="SpecialistReviewFinding" />.
/// </summary>
public static class AuthorityFindingToSpecialistMapper
{
    private const string EngineType = "ArchitectureIntelligence";
    private const string FindingType = "ArchitectureIntelligence.SpecialistReview";

    public static SpecialistReviewFinding? TryMap(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.Equals(finding.EngineType, EngineType, StringComparison.Ordinal)
            && !string.Equals(finding.FindingType, FindingType, StringComparison.Ordinal))
            return null;

        QualityDimension dimension = TryParseDimension(finding.PolicyRuleId, finding.QualityDimension);

        return new SpecialistReviewFinding
        {
            FindingId = finding.FindingId ?? Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Severity = MapSeverity(finding.Severity),
            Title = finding.Title ?? string.Empty,
            Rationale = finding.Rationale ?? string.Empty,
            Confidence = finding.ConfidenceScore ?? 1.0,
            RelatedModelElementIds = ExtractRelatedElementIds(finding),
            GovernanceDisposition = MapDisposition(finding.HumanReviewStatus),
        };
    }

    public static List<SpecialistReviewFinding> MapAll(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<SpecialistReviewFinding> mapped = [];

        foreach (Finding finding in findings)
        {
            SpecialistReviewFinding? specialist = TryMap(finding);

            if (specialist is not null)
                mapped.Add(specialist);
        }

        return mapped;
    }

    private static QualityDimension TryParseDimension(string? policyRuleId, string? qualityDimension)
    {
        if (!string.IsNullOrWhiteSpace(policyRuleId)
            && policyRuleId.StartsWith("architecture-intelligence.", StringComparison.OrdinalIgnoreCase))
        {
            string[] parts = policyRuleId.Split('.');

            if (parts.Length >= 3 && Enum.TryParse(parts[1], ignoreCase: true, out QualityDimension parsed))
                return parsed;
        }

        if (!string.IsNullOrWhiteSpace(qualityDimension)
            && Enum.TryParse(qualityDimension, ignoreCase: true, out QualityDimension fromStorage))
            return fromStorage;

        return QualityDimension.Security;
    }

    private static string MapSeverity(FindingSeverity severity) =>
        severity switch
        {
            FindingSeverity.Critical => "Critical",
            FindingSeverity.Error => "High",
            FindingSeverity.Info => "Low",
            _ => "Medium",
        };

    private static GovernanceDisposition MapDisposition(FindingHumanReviewStatus status) =>
        status switch
        {
            FindingHumanReviewStatus.Approved => GovernanceDisposition.Accepted,
            FindingHumanReviewStatus.Overridden => GovernanceDisposition.ExceptionGranted,
            FindingHumanReviewStatus.Pending => GovernanceDisposition.HumanDecisionRequired,
            _ => GovernanceDisposition.Deferred,
        };

    private static List<string> ExtractRelatedElementIds(Finding finding)
    {
        if (finding.Properties is null)
            return [];

        if (finding.Properties.TryGetValue("architectureIntelligence.relatedElementIds", out string? joined)
            && !string.IsNullOrWhiteSpace(joined))
        {
            return joined
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.Ordinal)
                .ToList();
        }

        return [];
    }
}
