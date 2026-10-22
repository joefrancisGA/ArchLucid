using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Persistence.Coordination.Compare;

public sealed partial class AuthorityCompareService
{
    private static void CompareRequirements(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        Dictionary<string, RequirementCoverageItem> leftMap = ToFirstWins(left.Requirements.Covered,
            x => x.RequirementName);
        Dictionary<string, RequirementCoverageItem> rightMap =
            ToFirstWins(right.Requirements.Covered, x => x.RequirementName);

        CompareKeyedSets(
            result,
            "Requirements",
            leftMap,
            rightMap,
            l => l.CoverageStatus,
            r => r.CoverageStatus,
            l => l.RequirementText,
            r => r.RequirementText);
    }

    private static void CompareTopology(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        CompareStringLists(result, "Topology.Gaps", left.Topology.Gaps, right.Topology.Gaps);
        CompareStringLists(result, "Topology.Resources", left.Topology.Resources, right.Topology.Resources);
        CompareStringLists(result, "Topology.Patterns", left.Topology.SelectedPatterns,
            right.Topology.SelectedPatterns);
    }

    private static void CompareSecurity(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        Dictionary<string, SecurityPostureItem> leftMap = ToFirstWins(left.Security.Controls, x => x.ControlName);
        Dictionary<string, SecurityPostureItem> rightMap = ToFirstWins(right.Security.Controls, x => x.ControlName);

        CompareKeyedSets(
            result,
            "Security.Controls",
            leftMap,
            rightMap,
            l => l.Status,
            r => r.Status,
            l => l.Impact,
            r => r.Impact);

        CompareStringLists(result, "Security.Gaps", left.Security.Gaps, right.Security.Gaps);
    }

    private static void CompareCost(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        AddDiff(
            result,
            "Cost",
            "MaxMonthlyCost",
            left.Cost.MaxMonthlyCost?.ToString(),
            right.Cost.MaxMonthlyCost?.ToString());

        CompareStringLists(result, "Cost.Risks", left.Cost.CostRisks, right.Cost.CostRisks);
        CompareStringLists(result, "Cost.Notes", left.Cost.Notes, right.Cost.Notes);
    }

    private static void CompareIssues(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        Dictionary<string, ManifestIssue> leftMap = ToFirstWins(left.UnresolvedIssues.Items, x => x.Title);
        Dictionary<string, ManifestIssue> rightMap = ToFirstWins(right.UnresolvedIssues.Items, x => x.Title);

        CompareKeyedSets(
            result,
            "Issues",
            leftMap,
            rightMap,
            l => l.Severity,
            r => r.Severity,
            l => l.Description,
            r => r.Description);
    }

    private static void CompareAssumptions(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        CompareStringLists(result, "Assumptions", left.Assumptions, right.Assumptions);
    }

    private static void CompareWarnings(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        CompareStringLists(result, "Warnings", left.Warnings, right.Warnings);
    }

    private static void CompareDecisions(
        ManifestDocument left,
        ManifestDocument right,
        ManifestComparisonResult result)
    {
        Dictionary<string, ResolvedArchitectureDecision> leftMap = ToFirstWins(left.Decisions,
            x => $"{x.Category}:{x.Title}");
        Dictionary<string, ResolvedArchitectureDecision> rightMap = ToFirstWins(right.Decisions,
            x => $"{x.Category}:{x.Title}");

        CompareKeyedSets(
            result,
            "Decisions",
            leftMap,
            rightMap,
            l => l.SelectedOption,
            r => r.SelectedOption,
            l => l.Rationale,
            r => r.Rationale);
    }
}
