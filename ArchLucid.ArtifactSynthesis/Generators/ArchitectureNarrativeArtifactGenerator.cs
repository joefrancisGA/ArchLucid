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
        if (manifest.Metadata?.Summary is null)
            sb.AppendLine("Sponsor summary was not stored.");
        else if (string.IsNullOrWhiteSpace(manifest.Metadata.Summary))
            sb.AppendLine("Sponsor summary was stored empty.");
        else
            sb.AppendLine(manifest.Metadata.Summary.Trim());
        sb.AppendLine();

        sb.AppendLine("## Requirements Coverage");

        ManifestPostureListHonesty.AppendRequirementsCoverageSection(sb, manifest.Requirements);

        sb.AppendLine();

        sb.AppendLine("## Topology Posture");

        if (manifest.Topology is null)
        {
            sb.AppendLine(ManifestPostureListHonesty.TopologySectionNotStored);
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
                sb.AppendLine(ManifestPostureListHonesty.TopologyPostureStoredEmpty);
            }
        }

        sb.AppendLine();

        sb.AppendLine("## Security Posture");

        if (manifest.Security.Controls.Count == 0)

            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.SecurityControlsStoredEmpty);

        else

            foreach (SecurityPostureItem control in manifest.Security.Controls)
            {
                string controlId = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.ControlId,
                    ArchitectureManifestNarrativeHonestyCopy.ControlIdNotStored);
                string controlName = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.ControlName,
                    ArchitectureManifestNarrativeHonestyCopy.ControlNameNotStored);
                string impact = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                    control.Impact,
                    ArchitectureManifestNarrativeHonestyCopy.ImpactNotStored,
                    ArchitectureManifestNarrativeHonestyCopy.ImpactStoredEmpty);
                string status = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                    control.Status,
                    ArchitectureManifestNarrativeHonestyCopy.StatusNotStored,
                    ArchitectureManifestNarrativeHonestyCopy.StatusStoredEmpty);
                sb.AppendLine(
                    $"- {controlId} {controlName} ({impact}): {status}");
            }

        foreach (string gap in manifest.Security.Gaps)
            sb.AppendLine(
                $"- Security Gap: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(gap, "Security gap was not stored.", "Security gap was stored empty.")}");

        sb.AppendLine();

        sb.AppendLine("## Compliance Posture");

        ManifestPostureListHonesty.AppendCompliancePostureSection(sb, manifest.Compliance, referenceStyle: false);

        sb.AppendLine();

        sb.AppendLine("## Cost Posture");
        CostSection costSection = manifest.Cost ?? new CostSection();
        sb.AppendLine(
            $"- Max Monthly Cost: {(manifest.Cost is not null && costSection.MaxMonthlyCost.HasValue ? costSection.MaxMonthlyCost.Value.ToString("0.00") : ArchitectureManifestNarrativeHonestyCopy.MaxMonthlyCostNotStored)}");
        if (manifest.Cost is not null)
        {
            sb.AppendLine(
                $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(costSection.CurrencyCode, ArchitectureManifestNarrativeHonestyCopy.CostCurrencyNotStored)}");
        }

        if (manifest.Cost is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostRisksNotStored}");
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.CostNotesNotStored}");
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
                sb.AppendLine($"- Cost Risk: {risk}");
        }

        if (manifest.Cost is not null)
        {
            if (manifest.Cost.Notes is null)
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
                    sb.AppendLine($"- Cost Note: {note}");
            }
        }

        sb.AppendLine();

        sb.AppendLine("## Assumptions");

        foreach (string assumption in manifest.Assumptions)
            sb.AppendLine(
                $"- {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(assumption, "Assumption was not stored.", "Assumption was stored empty.")}");

        if (manifest.Assumptions.Count == 0)

            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.AssumptionsStoredEmpty);

        sb.AppendLine();

        sb.AppendLine("## Constraints");

        foreach (string item in manifest.Constraints.MandatoryConstraints)
            sb.AppendLine(
                $"- Mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Mandatory constraint was not stored.", "Mandatory constraint was stored empty.")}");

        foreach (string item in manifest.Constraints.Preferences)
            sb.AppendLine(
                $"- Preference: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Constraint preference was not stored.", "Constraint preference was stored empty.")}");

        if (manifest.Constraints.MandatoryConstraints.Count == 0 && manifest.Constraints.Preferences.Count == 0)

            sb.AppendLine("Mandatory constraints and preferences were stored as empty lists.");
        else if (manifest.Constraints.MandatoryConstraints.Count == 0)
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.MandatoryConstraintsStoredEmpty);
        else if (manifest.Constraints.Preferences.Count == 0)
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.ConstraintPreferencesStoredEmpty);

        sb.AppendLine();

        sb.AppendLine("## Decisions");

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)

            sb.AppendLine(FormatDecisionLine(decision));

        if (manifest.Decisions.Count == 0)

            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.DecisionsStoredEmpty);

        sb.AppendLine();

        sb.AppendLine("## Unresolved Issues");

        if (manifest.UnresolvedIssues is null)
        {
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored);
        }
        else if (manifest.UnresolvedIssues.Items.Count == 0)
        {
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesStoredEmpty);
        }
        else
            foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
            {
                string findingSuffix = issue.SupportingFindingIds.Count == 0
                    ? $" ({ArchitectureManifestNarrativeHonestyCopy.SupportingFindingsStoredEmpty})"
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
            manifest.Provenance.AppliedRuleIds is null
                ? $"- {ArchitectureManifestNarrativeHonestyCopy.AppliedRuleIdsNotStored}"
                : manifest.Provenance.AppliedRuleIds.Count > 0
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
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlag(item)})";

        if (string.IsNullOrWhiteSpace(item.RequirementText))
            return line;

        return $"{line} — {item.RequirementText}";
    }
}
