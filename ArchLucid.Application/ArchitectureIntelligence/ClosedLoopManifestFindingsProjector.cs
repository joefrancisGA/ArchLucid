using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Projects closed-loop manifest merge rows into product-shaped findings for finalize scorecard parity (TB-2352 lift).
/// </summary>
public static class ClosedLoopManifestFindingsProjector
{
    private const string ClosedLoopEngineType = "closed-loop-strengthening";
    private const string ClosedLoopCoverageStatus = "ClosedLoopStrengthened";
    private const string ClosedLoopIssueType = "ClosedLoopFinding";

    public static IReadOnlyList<Finding> ProjectSupplementalFindings(
        ManifestDocument manifest,
        IReadOnlyCollection<string> existingFindingIds)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        HashSet<string> knownFindingIds = new(existingFindingIds, StringComparer.Ordinal);
        List<Finding> projected = [];

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
        {
            if (!string.Equals(issue.IssueType, ClosedLoopIssueType, StringComparison.Ordinal))
                continue;

            if (issue.SupportingFindingIds.Any(id => knownFindingIds.Contains(id)))
                continue;

            projected.Add(MapIssue(issue));
        }

        foreach (RequirementCoverageItem requirement in manifest.Requirements.Uncovered)
        {
            if (!string.Equals(requirement.CoverageStatus, ClosedLoopCoverageStatus, StringComparison.Ordinal))
                continue;

            string findingId = BuildRequirementFindingId(requirement.RequirementName);

            if (knownFindingIds.Contains(findingId))
                continue;

            projected.Add(MapRequirementCoverage(requirement, findingId));
            knownFindingIds.Add(findingId);
        }

        return projected;
    }

    private static Finding MapIssue(ManifestIssue issue)
    {
        string findingId = issue.SupportingFindingIds.FirstOrDefault() ?? Guid.NewGuid().ToString("N");

        return new Finding
        {
            FindingId = findingId,
            FindingType = "ClosedLoopManifestIssue",
            Category = "Architecture",
            EngineType = ClosedLoopEngineType,
            Severity = ParseSeverity(issue.Severity),
            Title = issue.Title,
            Rationale = issue.Description,
            PolicyRuleId = "closed-loop-manifest-issue",
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["closed-loop-strengthening"],
                DecisionsTaken = ["Projected manifest unresolved issue into findings snapshot for finalize parity."],
            },
        };
    }

    private static Finding MapRequirementCoverage(RequirementCoverageItem requirement, string findingId)
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "ClosedLoopRequirementCoverage",
            Category = "Requirements",
            EngineType = ClosedLoopEngineType,
            Severity = requirement.IsMandatory ? FindingSeverity.Error : FindingSeverity.Warning,
            Title = $"Uncovered requirement: {requirement.RequirementName}",
            Rationale =
                $"Uncovered requirement from closed-loop strengthening: {requirement.RequirementText}. "
                + "Requirement lacks committed topology or decision evidence.",
            PolicyRuleId = "requirement-coverage",
            RecommendedActions = [requirement.RequirementText],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["requirement-coverage", "closed-loop-strengthening"],
                DecisionsTaken =
                [
                    $"Merged closed-loop recommendation into manifest coverage with status {ClosedLoopCoverageStatus}.",
                ],
            },
        };
    }

    private static string BuildRequirementFindingId(string requirementName) =>
        $"cl-req-{requirementName.GetHashCode(StringComparison.Ordinal):x}";

    private static FindingSeverity ParseSeverity(string? severityText)
    {
        if (string.IsNullOrWhiteSpace(severityText))
            return FindingSeverity.Warning;

        return severityText.Trim().ToUpperInvariant() switch
        {
            "CRITICAL" => FindingSeverity.Critical,
            "ERROR" or "HIGH" => FindingSeverity.Error,
            "WARNING" or "MEDIUM" => FindingSeverity.Warning,
            "INFO" or "LOW" => FindingSeverity.Info,
            _ => FindingSeverity.Warning,
        };
    }
}
