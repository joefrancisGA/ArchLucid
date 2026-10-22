using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Advisory.Analysis;

public sealed partial class ImprovementSignalAnalyzer
{
    private static void CollectManifestSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        AnalyzeRequirementSignals(manifest, signals);
        AnalyzeSecuritySignals(manifest, signals);
        AnalyzeComplianceSignals(manifest, signals);
        AnalyzePolicyViolationSignals(manifest, signals);
        AnalyzeTopologySignals(manifest, signals);
        AnalyzeCostSignals(manifest, signals);
        AnalyzeUnresolvedIssueSignals(manifest, signals);
    }

    private static void AnalyzeRequirementSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (RequirementCoverageItem uncovered in manifest.Requirements.Uncovered)

            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.UncoveredRequirement,
                Category = ImprovementSignalCategories.Requirement,
                Title = $"Requirement not covered: {uncovered.RequirementName}",
                Description = string.IsNullOrWhiteSpace(uncovered.RequirementText)
                    ? uncovered.RequirementName
                    : uncovered.RequirementText,
                Severity = ImprovementSignalSeverities.High,
                FindingIds = uncovered.SupportingFindingIds.ToList()
            });
    }

    private static void AnalyzeSecuritySignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (string gap in manifest.Security.Gaps)

            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.SecurityGap,
                Category = ImprovementSignalCategories.Security,
                Title = "Security protection gap",
                Description = gap,
                Severity = ImprovementSignalSeverities.High
            });
    }

    private static void AnalyzeComplianceSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (string gap in manifest.Compliance.Gaps)

            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.ComplianceGap,
                Category = ImprovementSignalCategories.Compliance,
                Title = "Compliance gap detected",
                Description = gap,
                Severity = ImprovementSignalSeverities.High
            });
    }

    private static void AnalyzePolicyViolationSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        signals.AddRange(manifest.Policy.Violations.Select(violation => new ImprovementSignal
        {
            SignalType = ImprovementSignalTypes.PolicyViolation,
            Category = ImprovementSignalCategories.Compliance,
            Title = string.IsNullOrWhiteSpace(violation.ControlName)
                ? "Policy violation"
                : $"Policy violation: {violation.ControlName}",
            Description = string.IsNullOrWhiteSpace(violation.Description)
                ? violation.ControlId
                : violation.Description,
            Severity = ImprovementSignalSeverities.High
        }));
    }

    private static void AnalyzeTopologySignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (string gap in manifest.Topology.Gaps)

            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.TopologyGap,
                Category = ImprovementSignalCategories.Topology,
                Title = "Topology coverage gap",
                Description = gap,
                Severity = ImprovementSignalSeverities.Medium
            });
    }

    private static void AnalyzeCostSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (string risk in manifest.Cost.CostRisks)

            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.CostRisk,
                Category = ImprovementSignalCategories.Cost,
                Title = "Cost risk detected",
                Description = risk,
                Severity = ImprovementSignalSeverities.Medium
            });
    }

    private static void AnalyzeUnresolvedIssueSignals(ManifestDocument manifest, List<ImprovementSignal> signals)
    {
        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
        {
            string sev = string.IsNullOrWhiteSpace(issue.Severity)
                ? ImprovementSignalSeverities.Medium
                : issue.Severity;
            signals.Add(new ImprovementSignal
            {
                SignalType = ImprovementSignalTypes.UnresolvedIssue,
                Category = ImprovementSignalCategories.Risk,
                Title = issue.Title,
                Description = issue.Description,
                Severity = string.Equals(sev, ImprovementSignalSeverities.Critical, StringComparison.OrdinalIgnoreCase)
                    ? ImprovementSignalSeverities.Critical
                    : sev,
                FindingIds = issue.SupportingFindingIds.ToList()
            });
        }
    }
}
