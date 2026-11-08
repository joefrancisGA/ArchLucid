using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

internal static class ManifestGoldenDiagramAstHonesty
{
    internal static string FormatDecisionNodeType(ResolvedArchitectureDecision decision)
    {
        ArgumentNullException.ThrowIfNull(decision);

        return ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            decision.Category,
            ArchitectureManifestNarrativeHonestyCopy.DecisionCategoryNotStored);
    }

    internal static string FormatDecisionLabel(ResolvedArchitectureDecision decision)
    {
        ArgumentNullException.ThrowIfNull(decision);

        string title = string.IsNullOrWhiteSpace(decision.Title)
            ? MermaidManifestDiagramHonestyCopy.DecisionTitleNotStored
            : decision.Title.Trim();
        string selectedOption = string.IsNullOrWhiteSpace(decision.SelectedOption)
            ? MermaidManifestDiagramHonestyCopy.SelectedOptionNotStored
            : decision.SelectedOption.Trim();

        return $"{title} → {selectedOption}";
    }

    internal static string FormatIssueNodeType(ManifestIssue issue)
    {
        ArgumentNullException.ThrowIfNull(issue);

        string severity = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            issue.Severity,
            ArchitectureManifestNarrativeHonestyCopy.IssueSeverityNotStored);
        string issueType = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            issue.IssueType,
            ArchitectureManifestNarrativeHonestyCopy.IssueTypeNotStored);

        return $"Issue · {severity} · {issueType}";
    }
}
