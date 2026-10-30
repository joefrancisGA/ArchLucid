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

        string summary = summaryRaw.Trim();

        if (summary.Length > 0)
        {
            AppendBodyAndBlankLine(markdown, summary);
            return;
        }

        AppendBodyAndBlankLine(markdown, "Objective was stored empty.");
    }

    private static void AppendAssumptions(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Assumptions");
        AppendHonestStringList(
            markdown,
            manifest.Assumptions,
            static assumption => $"- {assumption}",
            "Assumptions were not stored.",
            "Assumptions were stored empty.",
            "Assumption was stored empty.");
    }

    private static void AppendConstraints(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Constraints");
        ConstraintSection constraints = manifest.Constraints ?? new ConstraintSection();
        IReadOnlyList<string>? mandatory = constraints.MandatoryConstraints;
        IReadOnlyList<string>? preferences = constraints.Preferences;

        if (mandatory is null && preferences is null)
        {
            AppendBodyAndBlankLine(markdown, "Constraints were not stored.");
            return;
        }

        List<string> lines = [];
        AppendHonestPrefixedItems(lines, mandatory, "Mandatory", "Constraint was stored empty.");
        AppendHonestPrefixedItems(lines, preferences, "Preference", "Constraint was stored empty.");

        if (lines.Count == 0)
        {
            AppendBodyAndBlankLine(markdown, "Constraints were stored empty.");
            return;
        }

        foreach (string line in lines)
            markdown.AppendLine(line);

        markdown.AppendLine();
    }

    private static void AppendArchitectureOverview(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Architecture Overview");
        if (manifest.Topology is null)
        {
            AppendBodyAndBlankLine(markdown, "Topology section was not stored.");
            return;
        }

        TopologySection topology = manifest.Topology;
        AppendHonestStringList(
            markdown,
            topology.SelectedPatterns,
            static pattern => $"- Pattern: {pattern}",
            "Architecture patterns were not stored.",
            "Architecture patterns were stored empty.",
            "Pattern was stored empty.");
    }

    private static void AppendComponentBreakdown(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Component Breakdown");
        if (manifest.Topology is null)
        {
            AppendBodyAndBlankLine(markdown, "Topology section was not stored.");
            return;
        }

        TopologySection topology = manifest.Topology;
        List<string> lines = [];

        AppendStoredStringListToLines(
            lines,
            topology.Resources,
            "Resources were not stored.",
            "Resources were stored as an empty list.",
            "Resource",
            "Resource was stored empty.");

        if (topology.Services is null)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesNotStored}");
        }
        else if (topology.Services.Count == 0)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesStoredEmpty}");
        }
        else
        {
            foreach (ManifestService? service in topology.Services)
            {
                if (service is null)
                {
                    lines.Add("- Service was not stored.");
                    continue;
                }

                string serviceName = FormatComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
                string serviceId = string.IsNullOrWhiteSpace(service.ServiceId)
                    ? "Service id was not stored."
                    : service.ServiceId.Trim();
                lines.Add($"- Service: {serviceName} ({FormatServiceType(service.ServiceType)}, id: {serviceId})");
            }
        }

        if (topology.Datastores is null)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresNotStored}");
        }
        else if (topology.Datastores.Count == 0)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresStoredEmpty}");
        }
        else
        {
            foreach (ManifestDatastore? datastore in topology.Datastores)
            {
                if (datastore is null)
                {
                    lines.Add("- Datastore was not stored.");
                    continue;
                }

                string datastoreName = FormatComponentName(
                    datastore.DatastoreName,
                    "Datastore name was not stored.",
                    "Datastore name was stored empty.");
                string datastoreId = string.IsNullOrWhiteSpace(datastore.DatastoreId)
                    ? "Datastore id was not stored."
                    : datastore.DatastoreId.Trim();
                lines.Add($"- Datastore: {datastoreName} ({FormatDatastoreType(datastore.DatastoreType)}, id: {datastoreId})");
            }
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
                {
                    lines.Add("- Relationship was not stored.");
                    continue;
                }

                string sourceId = string.IsNullOrWhiteSpace(relationship.SourceId)
                    ? "Relationship source id was not stored."
                    : relationship.SourceId.Trim();
                string targetId = string.IsNullOrWhiteSpace(relationship.TargetId)
                    ? "Relationship target id was not stored."
                    : relationship.TargetId.Trim();
                string relationshipType = FormatRelationshipType(relationship.RelationshipType);
                lines.Add($"- {sourceId} {relationshipType} {targetId}{FormatRelationshipDescriptionSuffix(relationship.Description)}");
            }
        }

        AppendStoredStringListToLines(
            lines,
            topology.Gaps,
            "Topology gaps were not stored.",
            "Topology gaps were stored as an empty list.",
            "Topology gap",
            "Topology gap was stored empty.");

        AppendLinesOrFallback(markdown, lines, "No data-flow relationships were recorded.");
    }

    private static void AppendSecurityModel(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Security Model");
        if (manifest.Security is null)
        {
            AppendBodyAndBlankLine(markdown, "Security section was not stored.");
            return;
        }

        SecuritySection security = manifest.Security;
        List<string> lines = [];

        if (security.Controls is null)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.SecurityControlsNotStored}");
        }
        else if (security.Controls.Count == 0)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.SecurityControlsStoredEmpty}");
        }
        else
        {
            foreach (SecurityPostureItem? control in security.Controls)
            {
                if (control is null)
                {
                    lines.Add("- Control was not stored.");
                    continue;
                }

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

        AppendStoredStringListToLines(
            lines,
            security.Gaps,
            "Security gaps were not stored.",
            "Security gaps were stored as an empty list.",
            "Security Gap",
            "Security gap was stored empty.");

        AppendLinesOrFallback(markdown, lines, "No security controls were recorded.");
    }

    private static void AppendOperationalConsiderations(StringBuilder markdown, ManifestDocument manifest)
    {
        markdown.AppendLine("## Operational Considerations");
        CostSection? cost = manifest.Cost;
        ComplianceSection? compliance = manifest.Compliance;
        UnresolvedIssuesSection? issues = manifest.UnresolvedIssues;
        List<string> lines = [];

        if (cost is null)
        {
            lines.Add($"- Max Monthly Cost: {ArchitectureManifestNarrativeHonestyCopy.MaxMonthlyCostNotStored}");
            lines.Add(
                $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatCostCurrency(null)}");
            lines.Add("- Cost risks were not stored.");
            lines.Add("- Cost notes were not stored.");
        }
        else
        {
            lines.Add(
                cost.MaxMonthlyCost.HasValue
                    ? $"- Max Monthly Cost: {cost.MaxMonthlyCost.Value.ToString("0.00")}"
                    : $"- Max Monthly Cost: {ArchitectureManifestNarrativeHonestyCopy.MaxMonthlyCostNotStored}");
            lines.Add(
                $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatCostCurrency(cost.CurrencyCode)}");

            AppendStoredStringListToLines(
                lines,
                cost.CostRisks,
                "Cost risks were not stored.",
                "Cost risks were stored as an empty list.",
                "Cost Risk",
                "Cost risk was stored empty.");
            AppendStoredStringListToLines(
                lines,
                cost.Notes,
                "Cost notes were not stored.",
                "Cost notes were stored as an empty list.",
                "Cost Note",
                "Cost note was stored empty.");
        }

        if (compliance is null)
        {
            lines.Add($"- {ManifestPostureListHonesty.ComplianceSectionNotStored}");
        }
        else
        {
            if (compliance.Controls is null)
            {
                lines.Add($"- {ManifestPostureListHonesty.ComplianceControlsNotStored}");
            }
            else
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

                if (compliance.Controls.Count == 0)
                    lines.Add($"- {ManifestPostureListHonesty.ComplianceControlsStoredEmpty}");
            }

            AppendStoredStringListToLines(
                lines,
                compliance.Gaps,
                "Compliance gaps were not stored.",
                "Compliance gaps were stored as an empty list.",
                "Compliance Gap",
                "Compliance gap was stored empty.");
        }

        if (issues is null)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored}");
        }
        else if (issues.Items is null)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored}");
        }
        else if (issues.Items.Count == 0)
        {
            lines.Add($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesStoredEmpty}");
        }
        else
        {
            foreach (ManifestIssue issue in issues.Items)
            {
                if (issue is null)
                    continue;

                string severity = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                    issue.Severity,
                    ArchitectureManifestNarrativeHonestyCopy.IssueSeverityNotStored,
                    ArchitectureManifestNarrativeHonestyCopy.IssueSeverityStoredEmpty);
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

    private static string FormatServiceType(ServiceType serviceType) =>
        serviceType == ServiceType.Unknown ? "Service type was not stored." : serviceType.ToString();

    private static string FormatDatastoreType(DatastoreType datastoreType) =>
        datastoreType == DatastoreType.Unknown ? "Datastore type was not stored." : datastoreType.ToString();

    private static string FormatRelationshipType(RelationshipType relationshipType) =>
        relationshipType switch
        {
            RelationshipType.Calls =>
                "has a stored call link. Observed invocation was not stored.",
            RelationshipType.ReadsFrom =>
                "has a stored read link. An observed read was not stored.",
            RelationshipType.WritesTo =>
                "has a stored write link. An observed write was not stored.",
            RelationshipType.PublishesTo =>
                "has a stored publish link. Observed delivery was not stored.",
            RelationshipType.SubscribesTo =>
                "has a stored subscription link. Observed consumption was not stored.",
            RelationshipType.AuthenticatesWith =>
                "has a stored authentication link. Observed sign-in was not stored.",
            _ when !Enum.IsDefined(relationshipType) || relationshipType == default =>
                "Relationship type was not stored.",
            _ when Enum.IsDefined(relationshipType) && relationshipType != default =>
                $"has a stored {relationshipType} link. Observed action was not stored.",
            _ => "Relationship type was not stored.",
        };

    private static string FormatRelationshipDescriptionSuffix(string? description)
    {
        if (description is null)
            return " — Relationship description was not stored.";

        if (description.Trim().Length == 0)
            return " — Relationship description was stored empty.";

        return $" — {description.Trim()}";
    }

    private static string FormatComponentName(string? raw, string notStored, string storedEmpty)
    {
        if (raw is null)
            return notStored;

        if (raw.Length == 0 || raw.Trim().Length == 0)
            return storedEmpty;

        return raw.Trim();
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

    private static void AppendHonestStringList(
        StringBuilder markdown,
        IReadOnlyList<string>? items,
        Func<string, string> formatLine,
        string notStoredFallback,
        string storedEmptyFallback,
        string whitespaceItemLabel)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentNullException.ThrowIfNull(formatLine);

        if (items is null)
        {
            AppendBodyAndBlankLine(markdown, notStoredFallback);
            return;
        }

        List<string> lines = [];

        foreach (string? item in items)
        {
            if (item is null)
            {
                lines.Add(
                    $"- {whitespaceItemLabel.Replace("was stored empty.", "was not stored.", StringComparison.Ordinal)}");
                continue;
            }

            if (item.Length == 0 || item.Trim().Length == 0)
            {
                lines.Add(formatLine(whitespaceItemLabel));
                continue;
            }

            lines.Add(formatLine(item.Trim()));
        }

        if (lines.Count == 0)
        {
            AppendBodyAndBlankLine(markdown, storedEmptyFallback);
            return;
        }

        foreach (string line in lines)
            markdown.AppendLine(line);

        markdown.AppendLine();
    }

    private static void AppendStoredStringListToLines(
        List<string> lines,
        IReadOnlyList<string>? items,
        string notStoredCopy,
        string emptyListCopy,
        string prefix,
        string whitespaceItemLabel)
    {
        ArgumentNullException.ThrowIfNull(lines);

        if (items is null)
        {
            lines.Add($"- {notStoredCopy}");
            return;
        }

        if (items.Count == 0)
        {
            lines.Add($"- {emptyListCopy}");
            return;
        }

        AppendHonestPrefixedItems(lines, items, prefix, whitespaceItemLabel);
    }

    private static void AppendHonestPrefixedItems(
        List<string> lines,
        IReadOnlyList<string>? items,
        string prefix,
        string whitespaceItemLabel)
    {
        ArgumentNullException.ThrowIfNull(lines);

        if (items is null)
            return;

        foreach (string? item in items)
        {
            if (item is null)
            {
                lines.Add($"- {prefix} was not stored.");
                continue;
            }

            if (item.Length == 0 || item.Trim().Length == 0)
            {
                lines.Add($"- {prefix}: {whitespaceItemLabel}");
                continue;
            }

            lines.Add($"- {prefix}: {item.Trim()}");
        }
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
