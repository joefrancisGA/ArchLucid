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

public class ArchitectureNarrativeArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.ArchitectureNarrative;

    public Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        _ = ct;
        StringBuilder sb = new();

        string reviewName = string.IsNullOrWhiteSpace(manifest.Metadata.Name)
            ? "Review name was not stored."
            : manifest.Metadata.Name.Trim();
        sb.AppendLine($"# {reviewName}");
        sb.AppendLine();
        ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(sb, manifest);
        sb.AppendLine("## Sponsor Summary");
        sb.AppendLine(string.IsNullOrWhiteSpace(manifest.Metadata.Summary)
            ? "Sponsor summary was not stored."
            : manifest.Metadata.Summary.Trim());
        sb.AppendLine();

        sb.AppendLine("## Requirements Coverage");

        if (manifest.Requirements.Covered.Count == 0 && manifest.Requirements.Uncovered.Count == 0)

            sb.AppendLine("No requirements were identified.");

        else
        {
            foreach (RequirementCoverageItem item in manifest.Requirements.Covered)
                sb.AppendLine(FormatRequirementLine("Covered", item));

            foreach (RequirementCoverageItem item in manifest.Requirements.Uncovered)
                sb.AppendLine(FormatRequirementLine("Uncovered", item));
        }

        sb.AppendLine();

        sb.AppendLine("## Topology Posture");

        foreach (string pattern in manifest.Topology.SelectedPatterns)

            sb.AppendLine($"- Pattern: {pattern}");

        if (manifest.Topology.Resources.Count > 0)

            foreach (string resource in manifest.Topology.Resources)

                sb.AppendLine($"- Resource: {resource}");

        else if (manifest.Topology.SelectedPatterns.Count == 0 && manifest.Topology.Gaps.Count == 0)

            sb.AppendLine("No concrete topology resources were recorded in the manifest.");

        foreach (string gap in manifest.Topology.Gaps)

            sb.AppendLine($"- Gap: {gap}");

        sb.AppendLine();

        sb.AppendLine("## Security Posture");

        if (manifest.Security.Controls.Count == 0)

            sb.AppendLine("No security controls were recorded.");

        else

            foreach (SecurityPostureItem control in manifest.Security.Controls)
            {
                string impact = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.Impact,
                    ArchitectureManifestNarrativeHonestyCopy.ImpactNotStored);
                string status = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.Status,
                    ArchitectureManifestNarrativeHonestyCopy.StatusNotStored);
                sb.AppendLine(
                    $"- {control.ControlId} {control.ControlName} ({impact}): {status}");
            }

        foreach (string gap in manifest.Security.Gaps)

            sb.AppendLine($"- Security Gap: {gap}");

        sb.AppendLine();

        sb.AppendLine("## Compliance Posture");

        if (manifest.Compliance.Controls.Count == 0)

            sb.AppendLine("No compliance posture items were recorded.");

        else

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

            sb.AppendLine($"- Compliance Gap: {gap}");

        sb.AppendLine();

        sb.AppendLine("## Cost Posture");
        sb.AppendLine(
            $"- Max Monthly Cost: {(manifest.Cost.MaxMonthlyCost.HasValue ? manifest.Cost.MaxMonthlyCost.Value.ToString("0.00") : ArchitectureManifestNarrativeHonestyCopy.MaxMonthlyCostNotStored)}");

        foreach (string risk in manifest.Cost.CostRisks)

            sb.AppendLine($"- Cost Risk: {risk}");

        foreach (string note in manifest.Cost.Notes)

            sb.AppendLine($"- Cost Note: {note}");

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

            sb.AppendLine("No decisions recorded.");

        sb.AppendLine();

        sb.AppendLine("## Unresolved Issues");

        if (manifest.UnresolvedIssues.Items.Count == 0)

            sb.AppendLine("Unresolved issues were not stored.");

        else

            foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
            {
                string findingSuffix = issue.SupportingFindingIds.Count == 0
                    ? string.Empty
                    : $" (supporting findings: {string.Join(", ", issue.SupportingFindingIds)})";

                string severity = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    issue.Severity,
                    ArchitectureManifestNarrativeHonestyCopy.IssueSeverityNotStored);
                string issueType = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    issue.IssueType,
                    ArchitectureManifestNarrativeHonestyCopy.IssueTypeNotStored);
                string title = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    issue.Title,
                    ArchitectureManifestNarrativeHonestyCopy.IssueTitleNotStored);
                string description = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    issue.Description,
                    ArchitectureManifestNarrativeHonestyCopy.IssueDescriptionNotStored);
                sb.AppendLine(
                    $"- [{severity}] {issueType} {title}: {description}{findingSuffix}");
            }

        sb.AppendLine();

        sb.AppendLine("## Provenance");
        sb.AppendLine(
            manifest.Provenance.SourceFindingIds.Count > 0
                ? $"- Source Findings: {manifest.Provenance.SourceFindingIds.Count}"
                : $"- {ArchitectureManifestNarrativeHonestyCopy.NoSourceFindingIdsStored}");
        sb.AppendLine(
            manifest.Provenance.SourceGraphNodeIds.Count > 0
                ? $"- Source Graph Nodes: {manifest.Provenance.SourceGraphNodeIds.Count}"
                : $"- {ArchitectureManifestNarrativeHonestyCopy.NoSourceGraphNodeIdsStored}");
        sb.AppendLine(
            manifest.Provenance.AppliedRuleIds.Count > 0
                ? $"- Applied Rules: {manifest.Provenance.AppliedRuleIds.Count}"
                : $"- {ArchitectureManifestNarrativeHonestyCopy.NoAppliedRuleIdsStored}");
        sb.AppendLine();

        string content = LlmArtifactFreeTextSanitizer.Sanitize(sb.ToString());

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.ArchitectureNarrative,
            Name = "architecture-narrative.md",
            Format = "markdown",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }

    private static string FormatDecisionLine(ResolvedArchitectureDecision decision)
    {
        string selectedOption = string.IsNullOrWhiteSpace(decision.SelectedOption)
            ? "Selected option was not stored."
            : decision.SelectedOption.Trim();

        string category = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            decision.Category,
            ArchitectureManifestNarrativeHonestyCopy.DecisionCategoryNotStored);
        string title = string.IsNullOrWhiteSpace(decision.Title)
            ? ArchitectureManifestNarrativeHonestyCopy.DecisionTitleNotStored
            : decision.Title.Trim();

        return $"- {category}: {title} -> {selectedOption}";
    }

    private static string FormatRequirementLine(string prefix, RequirementCoverageItem item)
    {
        string requirementName = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            item.RequirementName,
            ArchitectureManifestNarrativeHonestyCopy.RequirementNameNotStored);
        string coverageStatus = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            item.CoverageStatus,
            ArchitectureManifestNarrativeHonestyCopy.CoverageStatusNotStored);
        string line =
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {(item.IsMandatory ? "yes" : "no")})";

        if (string.IsNullOrWhiteSpace(item.RequirementText))
            return line;

        return $"{line} — {item.RequirementText}";
    }
}
