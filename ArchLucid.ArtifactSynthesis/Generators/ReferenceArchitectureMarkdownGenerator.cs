using System.Text;

using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Markdown;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Sanitization;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class ReferenceArchitectureMarkdownGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.ReferenceArchitectureMarkdown;

    public Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        _ = ct;
        StringBuilder sb = new();

        string reviewName = string.IsNullOrWhiteSpace(manifest.Metadata.Name)
            ? "Review name was not stored."
            : manifest.Metadata.Name.Trim();
        sb.AppendLine($"# Reference Architecture - {reviewName}");
        sb.AppendLine();
        sb.AppendLine(
            $"Status: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.Metadata?.Status, "Status")}");
        sb.AppendLine(
            $"Version: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.Metadata?.Version, "Version")}");
        sb.AppendLine();
        ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(sb, manifest);
        sb.AppendLine("## Manifest Metadata");
        sb.AppendLine(
            $"- Rule set id: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.RuleSetId, "Rule set id")}");
        sb.AppendLine(
            $"- Rule set version: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.RuleSetVersion, "Rule set version")}");
        sb.AppendLine(
            $"- Manifest hash: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.ManifestHash, "Manifest hash")}");
        sb.AppendLine();

        sb.AppendLine("## Sponsor Summary");

        if (string.IsNullOrWhiteSpace(manifest.Metadata?.Summary))
            sb.AppendLine("No summary was recorded for this manifest.");
        else
            sb.AppendLine(manifest.Metadata!.Summary);

        sb.AppendLine();

        sb.AppendLine("## Requirements");

        foreach (RequirementCoverageItem item in manifest.Requirements.Covered)
            sb.AppendLine(FormatRequirementLine("Covered", item));

        foreach (RequirementCoverageItem item in manifest.Requirements.Uncovered)
            sb.AppendLine(FormatRequirementLine("Uncovered", item));

        if (manifest.Requirements.Covered.Count == 0 && manifest.Requirements.Uncovered.Count == 0)

            sb.AppendLine("- No requirements recorded.");

        sb.AppendLine();

        sb.AppendLine("## Topology");

        foreach (string pattern in manifest.Topology.SelectedPatterns)

            sb.AppendLine($"- Pattern: {pattern}");

        foreach (string resource in manifest.Topology.Resources)

            sb.AppendLine($"- Resource: {resource}");

        foreach (string gap in manifest.Topology.Gaps)

            sb.AppendLine($"- Gap: {gap}");

        if (manifest.Topology.SelectedPatterns.Count == 0 &&
            manifest.Topology.Resources.Count == 0 &&
            manifest.Topology.Gaps.Count == 0)

            sb.AppendLine("- No topology information recorded.");

        sb.AppendLine();

        sb.AppendLine("## Security");

        foreach (SecurityPostureItem control in manifest.Security.Controls)
        {
            string controlId = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlId, "Control id");
            string controlName =
                DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name");
            string impact = DocxManifestFieldPresentation.FormatManifestTableCell(control.Impact, "Impact");
            string status = DocxManifestFieldPresentation.FormatManifestTableCell(control.Status, "Control status");
            sb.AppendLine($"- {controlId} {controlName} ({impact}): {status}");
        }

        foreach (string gap in manifest.Security.Gaps)

            sb.AppendLine($"- Gap: {gap}");

        if (manifest.Security.Controls.Count == 0 && manifest.Security.Gaps.Count == 0)

            sb.AppendLine("- No security posture recorded.");

        sb.AppendLine();

        sb.AppendLine("## Compliance");

        foreach (CompliancePostureItem control in manifest.Compliance.Controls)
        {
            string controlId = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlId, "Control id");
            string controlName =
                DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name");
            string appliesTo = DocxManifestFieldPresentation.FormatManifestTableCell(
                control.AppliesToCategory,
                "Applies-to category");
            string status = DocxManifestFieldPresentation.FormatManifestTableCell(control.Status, "Control status");
            sb.AppendLine($"- {controlId} {controlName} [{appliesTo}]: {status}");
        }

        foreach (string gap in manifest.Compliance.Gaps)

            sb.AppendLine($"- Gap: {gap}");

        if (manifest.Compliance.Controls.Count == 0 && manifest.Compliance.Gaps.Count == 0)

            sb.AppendLine("- No compliance posture recorded.");

        sb.AppendLine();

        sb.AppendLine("## Cost");
        sb.AppendLine(
            $"- Max Monthly Cost: {(manifest.Cost.MaxMonthlyCost.HasValue ? manifest.Cost.MaxMonthlyCost.Value.ToString("0.00") : "Max monthly cost was not stored.")}");

        foreach (string risk in manifest.Cost.CostRisks)

            sb.AppendLine($"- Risk: {risk}");

        foreach (string note in manifest.Cost.Notes)

            sb.AppendLine($"- Note: {note}");

        sb.AppendLine();

        sb.AppendLine("## Assumptions");

        foreach (string assumption in manifest.Assumptions)

            sb.AppendLine($"- {assumption}");

        if (manifest.Assumptions.Count == 0)

            sb.AppendLine("No assumptions were recorded.");

        sb.AppendLine();

        sb.AppendLine("## Constraints");

        foreach (string item in manifest.Constraints.MandatoryConstraints)

            sb.AppendLine($"- Mandatory: {item}");

        foreach (string item in manifest.Constraints.Preferences)

            sb.AppendLine($"- Preference: {item}");

        if (manifest.Constraints.MandatoryConstraints.Count == 0 && manifest.Constraints.Preferences.Count == 0)

            sb.AppendLine("No constraints were recorded.");

        sb.AppendLine();

        sb.AppendLine("## Decisions");

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)

            sb.AppendLine(FormatDecisionLine(decision));

        if (manifest.Decisions.Count == 0)

            sb.AppendLine("- No decisions recorded.");

        sb.AppendLine();

        sb.AppendLine("## Unresolved Issues");

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
        {
            string severity = DocxManifestFieldPresentation.FormatManifestTableCell(issue.Severity, "Severity");
            string issueType = DocxManifestFieldPresentation.FormatManifestTableCell(issue.IssueType, "Issue type");
            string title = DocxManifestFieldPresentation.FormatManifestTableCell(issue.Title, "Issue title");
            string description =
                DocxManifestFieldPresentation.FormatManifestTableCell(issue.Description, "Issue description");
            string findingSuffix = issue.SupportingFindingIds.Count == 0
                ? string.Empty
                : $" (supporting findings: {string.Join(", ", issue.SupportingFindingIds)})";

            sb.AppendLine($"- [{severity}] {issueType} {title}: {description}{findingSuffix}");
        }

        if (manifest.UnresolvedIssues.Items.Count == 0)

            sb.AppendLine("Unresolved issues were not stored.");

        string content = LlmArtifactFreeTextSanitizer.Sanitize(sb.ToString());

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.ReferenceArchitectureMarkdown,
            Name = "reference-architecture.md",
            Format = "markdown",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }

    private static string FormatDecisionLine(ResolvedArchitectureDecision decision)
    {
        string category =
            DocxManifestFieldPresentation.FormatManifestTableCell(decision.Category, "Decision category");
        string title = DocxManifestFieldPresentation.FormatManifestTableCell(decision.Title, "Decision title");
        string selectedOption = DocxManifestFieldPresentation.FormatManifestTableCell(
            decision.SelectedOption,
            "Selected option");

        return $"- {category}: {title} -> {selectedOption}";
    }

    private static string FormatRequirementLine(string prefix, RequirementCoverageItem item)
    {
        string requirementName =
            DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementName, "Requirement name");
        string coverageStatus =
            DocxManifestFieldPresentation.FormatManifestTableCell(item.CoverageStatus, "Coverage status");
        string line =
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {(item.IsMandatory ? "yes" : "no")})";

        string requirementText = DocxManifestFieldPresentation.FormatManifestTableCell(
            item.RequirementText,
            "Requirement text");

        return $"{line} — {requirementText}";
    }
}
