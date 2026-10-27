using System.Text;

using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.ArtifactSynthesis.Generators;

/// <summary>
///     Emits the second-level architecture markdown headings required by
///     <see cref="ArchLucid.ArtifactSynthesis.Validation.ArchitectureMarkdownSectionValidator" />.
///     Create-run synthesis fails closed (HTTP 400) when ArchitectureNarrative or
///     ReferenceArchitectureMarkdown omit any of those titles.
/// </summary>
public static class ArchitectureMandatedMarkdownSections
{
    public static void Append(StringBuilder markdown, ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(manifest);

        AppendObjective(markdown, manifest);
        AppendAssumptions(markdown, manifest);
        AppendConstraints(markdown, manifest);
        AppendArchitectureOverview(markdown, manifest);
        AppendComponentBreakdown(markdown, manifest);
        AppendDataFlow(markdown, manifest);
        AppendSecurityModel(markdown, manifest);
        AppendOperationalConsiderations(markdown, manifest);
    }

    private static void AppendObjective(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Objective");

        string summary = manifest.Metadata?.Summary?.Trim() ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(summary))
        {
            AppendBodyAndBlankLine(markdown, summary);
            return;
        }

        string name = manifest.Metadata?.Name?.Trim() ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(name))
        {
            AppendBodyAndBlankLine(markdown, name);
            return;
        }

        AppendBodyAndBlankLine(markdown, "No objective was recorded.");
    }

    private static void AppendAssumptions(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Assumptions");
        AppendBulletsOrFallback(
            markdown,
            manifest.Assumptions,
            static assumption => $"- {assumption}",
            "No assumptions were recorded.");
    }

    private static void AppendConstraints(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Constraints");
        ConstraintSection constraints = manifest.Constraints ?? new ConstraintSection();
        List<string> lines = [];

        AppendPrefixedItems(lines, constraints.MandatoryConstraints, "Mandatory");
        AppendPrefixedItems(lines, constraints.Preferences, "Preference");
        AppendLinesOrFallback(markdown, lines, "No constraints were recorded.");
    }

    private static void AppendArchitectureOverview(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Architecture Overview");
        TopologySection topology = manifest.Topology ?? new TopologySection();
        AppendBulletsOrFallback(
            markdown,
            topology.SelectedPatterns,
            static pattern => $"- Pattern: {pattern}",
            "No architecture patterns were recorded.");
    }

    private static void AppendComponentBreakdown(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Component Breakdown");
        TopologySection topology = manifest.Topology ?? new TopologySection();
        List<string> lines = [];

        AppendPrefixedItems(lines, topology.Resources, "Resource");

        if (topology.Services is not null)
        {
            foreach (ManifestService service in topology.Services)
            {
                if (service is null)
                    continue;

                string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                    ? service.ServiceId
                    : service.ServiceName.Trim();
                lines.Add($"- Service: {serviceName} ({service.ServiceType})");
            }
        }

        if (topology.Datastores is not null)
        {
            foreach (ManifestDatastore datastore in topology.Datastores)
            {
                if (datastore is null)
                    continue;

                string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                    ? datastore.DatastoreId
                    : datastore.DatastoreName.Trim();
                lines.Add($"- Datastore: {datastoreName} ({datastore.DatastoreType})");
            }
        }

        AppendLinesOrFallback(markdown, lines, "No components were recorded.");
    }

    private static void AppendDataFlow(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Data Flow");
        TopologySection topology = manifest.Topology ?? new TopologySection();
        List<string> lines = [];

        if (topology.Relationships is not null)
        {
            foreach (ManifestRelationship relationship in topology.Relationships)
            {
                if (relationship is null)
                    continue;

                string sourceId = string.IsNullOrWhiteSpace(relationship.SourceId)
                    ? "Relationship source id was not stored."
                    : relationship.SourceId.Trim();
                string targetId = string.IsNullOrWhiteSpace(relationship.TargetId)
                    ? "Relationship target id was not stored."
                    : relationship.TargetId.Trim();
                lines.Add($"- {sourceId} {relationship.RelationshipType} {targetId}");
            }
        }

        AppendLinesOrFallback(markdown, lines, "No data-flow relationships were recorded.");
    }

    private static void AppendSecurityModel(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Security Model");
        SecuritySection security = manifest.Security ?? new SecuritySection();
        List<string> lines = [];

        if (security.Controls is not null)
        {
            foreach (SecurityPostureItem control in security.Controls)
            {
                if (control is null)
                    continue;

                string controlId = string.IsNullOrWhiteSpace(control.ControlId)
                    ? "Control id was not stored."
                    : control.ControlId.Trim();
                string controlName = string.IsNullOrWhiteSpace(control.ControlName)
                    ? "Control name was not stored."
                    : control.ControlName.Trim();
                string impact = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.Impact,
                    ArchitectureManifestNarrativeHonestyCopy.ImpactNotStored);
                string status = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                    control.Status,
                    ArchitectureManifestNarrativeHonestyCopy.StatusNotStored);
                lines.Add($"- {controlId} {controlName} ({impact}): {status}");
            }
        }

        AppendPrefixedItems(lines, security.Gaps, "Security Gap");
        AppendLinesOrFallback(markdown, lines, "No security controls were recorded.");
    }

    private static void AppendOperationalConsiderations(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Operational Considerations");
        CostSection cost = manifest.Cost ?? new CostSection();
        ComplianceSection compliance = manifest.Compliance ?? new ComplianceSection();
        UnresolvedIssuesSection issues = manifest.UnresolvedIssues ?? new UnresolvedIssuesSection();
        List<string> lines = [];

        lines.Add(
            cost.MaxMonthlyCost.HasValue
                ? $"- Max Monthly Cost: {cost.MaxMonthlyCost.Value.ToString("0.00")}"
                : $"- Max Monthly Cost: {ArchitectureManifestNarrativeHonestyCopy.MaxMonthlyCostNotStored}");

        AppendPrefixedItems(lines, cost.CostRisks, "Cost Risk");
        AppendPrefixedItems(lines, cost.Notes, "Cost Note");

        if (compliance.Controls is not null)
        {
            foreach (CompliancePostureItem control in compliance.Controls)
            {
                if (control is null)
                    continue;

                string controlId = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlId, "Control id");
                string controlName =
                    DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name");
                string appliesTo = DocxManifestFieldPresentation.FormatManifestTableCell(
                    control.AppliesToCategory,
                    "Applies-to category");
                string status = DocxManifestFieldPresentation.FormatManifestTableCell(control.Status, "Control status");
                lines.Add($"- {controlId} {controlName} [{appliesTo}]: {status}");
            }
        }

        AppendPrefixedItems(lines, compliance.Gaps, "Compliance Gap");

        if (issues.Items is not null)
        {
            foreach (ManifestIssue issue in issues.Items)
            {
                if (issue is null)
                    continue;

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
                lines.Add($"- [{severity}] {issueType} {title}: {description}");
            }
        }

        AppendLinesOrFallback(markdown, lines, "No operational considerations were recorded.");
    }

    private static void AppendPrefixedItems(List<string> lines, IReadOnlyList<string>? items, string prefix)
    {
        ArgumentNullException.ThrowIfNull(lines);

        if (items is null)
            return;

        foreach (string item in items)
        {
            if (string.IsNullOrWhiteSpace(item))
                continue;

            lines.Add($"- {prefix}: {item.Trim()}");
        }
    }

    private static void AppendBulletsOrFallback(
        StringBuilder markdown,
        IReadOnlyList<string>? items,
        Func<string, string> formatLine,
        string fallback)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(formatLine);

        List<string> lines = [];

        if (items is not null)
        {
            foreach (string item in items)
            {
                if (string.IsNullOrWhiteSpace(item))
                    continue;

                lines.Add(formatLine(item.Trim()));
            }
        }

        AppendLinesOrFallback(markdown, lines, fallback);
    }

    private static void AppendLinesOrFallback(StringBuilder markdown, IReadOnlyList<string> lines, string fallback)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(lines);

        if (lines.Count == 0)
        {
            AppendBodyAndBlankLine(markdown, fallback);
            return;
        }

        foreach (string line in lines)
            markdown.AppendLine(line);

        markdown.AppendLine();
    }

    private static void AppendBodyAndBlankLine(StringBuilder markdown, string body)
    {
        markdown.AppendLine(body);
        markdown.AppendLine();
    }
}
