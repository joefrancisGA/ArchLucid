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

        if (manifest.Metadata?.Summary is null)
            sb.AppendLine("Sponsor summary was not stored.");
        else if (string.IsNullOrWhiteSpace(manifest.Metadata.Summary))
            sb.AppendLine("Sponsor summary was stored empty.");
        else
            sb.AppendLine(manifest.Metadata.Summary.Trim());

        sb.AppendLine();

        sb.AppendLine("## Requirements");

        ManifestPostureListHonesty.AppendReferenceRequirementsSection(sb, manifest.Requirements);

        sb.AppendLine();

        sb.AppendLine("## Topology");

        if (manifest.Topology is null)
        {
            sb.AppendLine($"- {ManifestPostureListHonesty.TopologySectionNotStored}");
        }
        else
        {
            TopologySection topology = manifest.Topology;
            int topologyWritten = 0;

            topologyWritten += ManifestPostureListHonesty.AppendTopologyStringList(
                sb,
                topology.SelectedPatterns,
                "Selected patterns were not stored.",
                "Selected patterns were stored as an empty list.",
                "Pattern");
            topologyWritten += ManifestPostureListHonesty.AppendTopologyStringList(
                sb,
                topology.Resources,
                "Resources were not stored.",
                "Resources were stored as an empty list.",
                "Resource");
            topologyWritten += ManifestPostureListHonesty.AppendTopologyStringList(
                sb,
                topology.Gaps,
                "Topology gaps were not stored.",
                "Topology gaps were stored as an empty list.",
                "Gap");

            if (topologyWritten == 0
                && topology.SelectedPatterns is not null
                && topology.Resources is not null
                && topology.Gaps is not null)
            {
                sb.AppendLine($"- {ManifestPostureListHonesty.TopologyPostureStoredEmpty}");
            }
        }

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

        ManifestPostureListHonesty.AppendCompliancePostureSection(sb, manifest.Compliance, referenceStyle: true);

        sb.AppendLine();

        sb.AppendLine("## Cost");
        CostSection costSection = manifest.Cost ?? new CostSection();
        sb.AppendLine(
            $"- Max Monthly Cost: {(costSection.MaxMonthlyCost.HasValue ? costSection.MaxMonthlyCost.Value.ToString("0.00") : "Max monthly cost was not stored.")}");
        sb.AppendLine(
            $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatCostCurrency(costSection.CurrencyCode)}");
        if (manifest.Cost is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostRisksNotStored}");
        }
        else if (manifest.Cost.CostRisks is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostRisksNotStored}");
        }
        else if (manifest.Cost.CostRisks.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostRisksStoredEmpty}");
        }
        else
        {
            foreach (string risk in manifest.Cost.CostRisks)
            {
                sb.AppendLine($"- Risk: {risk}");
            }
        }

        if (manifest.Cost is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostNotesNotStored}");
        }
        else if (manifest.Cost.Notes is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostNotesNotStored}");
        }
        else if (manifest.Cost.Notes.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostNotesStoredEmpty}");
        }
        else
        {
            foreach (string note in manifest.Cost.Notes)
            {
                sb.AppendLine($"- Note: {note}");
            }
        }

        sb.AppendLine();

        sb.AppendLine("## Assumptions");

        if (manifest.Assumptions is null)
        {
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.AssumptionsNotStored);
        }
        else
        {
            foreach (string assumption in manifest.Assumptions)
            {
                sb.AppendLine(
                    $"- {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(assumption, "Assumption was not stored.", "Assumption was stored empty.")}");
            }

            if (manifest.Assumptions.Count == 0)
            {
                sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.AssumptionsStoredEmpty);
            }
        }

        sb.AppendLine();

        sb.AppendLine("## Constraints");

        if (manifest.Constraints is null)
        {
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.ConstraintsNotStored);
        }
        else
        {
            foreach (string item in manifest.Constraints.MandatoryConstraints)
            {
                sb.AppendLine(
                    $"- Mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Mandatory constraint was not stored.", "Mandatory constraint was stored empty.")}");
            }

            foreach (string item in manifest.Constraints.Preferences)
            {
                sb.AppendLine(
                    $"- Preference: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Preference was not stored.", "Preference was stored empty.")}");
            }

            if (manifest.Constraints.MandatoryConstraints.Count == 0 && manifest.Constraints.Preferences.Count == 0)
            {
                sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.ConstraintsStoredEmpty);
            }
        }

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
                ? $" ({ArchitectureManifestNarrativeHonestyCopy.SupportingFindingsStoredEmpty})"
                : $" (supporting findings: {string.Join(", ", issue.SupportingFindingIds)})";

            sb.AppendLine($"- [{severity}] {issueType} {title}: {description}{findingSuffix}");
        }

        if (manifest.UnresolvedIssues is null)
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored}");
        else if (manifest.UnresolvedIssues.Items.Count == 0)
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesStoredEmpty}");

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
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlag(item)})";

        string requirementText = DocxManifestFieldPresentation.FormatManifestTableCell(
            item.RequirementText,
            "Requirement text");

        return $"{line} — {requirementText}";
    }
}
