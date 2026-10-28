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

        string? summaryRaw = manifest.Metadata?.Summary;

        if (summaryRaw is null)
        {
            AppendBodyAndBlankLine(markdown, "Objective was not stored.");
            return;
        }

        if (summaryRaw.Trim().Length > 0)
        {
            AppendBodyAndBlankLine(markdown, summaryRaw.Trim());
            return;
        }

        AppendBodyAndBlankLine(markdown, "Objective was stored empty.");
    }

    private static void AppendAssumptions(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Assumptions");

        if (manifest.Assumptions is null)
        {
            AppendBodyAndBlankLine(markdown, "Assumptions were not stored.");
            return;
        }

        if (manifest.Assumptions.Count == 0)
        {
            AppendBodyAndBlankLine(markdown, "Assumptions were stored as an empty list.");
            return;
        }

        AppendBulletsOrFallback(
            markdown,
            manifest.Assumptions,
            static assumption => $"- {assumption}",
            "Assumptions were stored as an empty list.");
    }

    private static void AppendConstraints(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Constraints");

        if (manifest.Constraints is null)
        {
            AppendBodyAndBlankLine(markdown, "Constraints were not stored.");
            return;
        }

        ConstraintSection constraints = manifest.Constraints;
        List<string> lines = [];

        lines.AddRange(FormatStoredStringListLines(
            constraints.MandatoryConstraints,
            "Mandatory constraints were not stored.",
            "Mandatory constraints were stored as an empty list.",
            "Mandatory"));
        lines.AddRange(FormatStoredStringListLines(
            constraints.Preferences,
            "Constraint preferences were not stored.",
            "Constraint preferences were stored as an empty list.",
            "Preference"));

        AppendLinesOrFallback(markdown, lines, "Constraints were stored as an empty list.");
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

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            string serviceName = FormatComponentName(
                service.ServiceName,
                "Service name was not stored.",
                "Service name was stored empty.");
            string serviceType = service.ServiceType == ServiceType.Unknown
                ? "Service type was not stored."
                : service.ServiceType.ToString();
            lines.Add($"- Service: {serviceName} ({serviceType})");
        }

        foreach (ManifestDatastore datastore in (topology.Datastores ?? []).Where(static d => d is not null))
        {
            string datastoreName = FormatComponentName(
                datastore.DatastoreName,
                "Datastore name was not stored.",
                "Datastore name was stored empty.");
            string datastoreType = datastore.DatastoreType == DatastoreType.Unknown
                ? "Datastore type was not stored."
                : datastore.DatastoreType.ToString();
            lines.Add($"- Datastore: {datastoreName} ({datastoreType})");
        }

        AppendLinesOrFallback(markdown, lines, "No components were recorded.");
    }

    private static void AppendDataFlow(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Data Flow");

        if (manifest.Topology is null)
        {
            AppendBodyAndBlankLine(markdown, "Topology section was not stored.");
            return;
        }

        TopologySection topology = manifest.Topology;
        List<string> lines = [];

        if (topology.Relationships is null)
        {
            lines.Add("- Data-flow relationships were not stored.");
        }
        else if (topology.Relationships.Count == 0)
        {
            lines.Add("- Data-flow relationships were stored as an empty list.");
        }
        else
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
                string relationshipType = Enum.IsDefined(relationship.RelationshipType)
                                            && relationship.RelationshipType != default
                    ? relationship.RelationshipType.ToString()
                    : "Relationship type was not stored.";
                lines.Add($"- {sourceId} {relationshipType} {targetId}");
            }
        }

        lines.AddRange(FormatStoredStringListLines(
            topology.Gaps,
            "Topology gaps were not stored.",
            "Topology gaps were stored as an empty list.",
            "Topology gap"));

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

    private static string FormatComponentName(string? name, string notStoredCopy, string storedEmptyCopy) =>
        ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(name, notStoredCopy, storedEmptyCopy);

    private static IEnumerable<string> FormatStoredStringListLines(
        IList<string>? values,
        string notStoredCopy,
        string emptyListCopy,
        string bulletLabel)
    {
        if (values is null)
        {
            yield return $"- {notStoredCopy}";
            yield break;
        }

        if (values.Count == 0)
        {
            yield return $"- {emptyListCopy}";
            yield break;
        }

        foreach (string value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            yield return $"- {bulletLabel}: {value.Trim()}";
        }
    }
}
