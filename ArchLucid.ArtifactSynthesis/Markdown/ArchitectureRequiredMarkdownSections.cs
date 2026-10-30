using System.Text;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using CoreManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;

namespace ArchLucid.ArtifactSynthesis.Markdown;

/// <summary>
///     Emits the product <c>##</c> headings required by
///     <see cref="Validation.ArchitectureMarkdownSectionValidator" /> that the posture-oriented
///     generators do not already write (<c>Assumptions</c> and <c>Constraints</c> stay caller-owned).
/// </summary>
public static class ArchitectureRequiredMarkdownSections
{
    public static void AppendRequiredProductSections(StringBuilder sb, ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(manifest);

        AppendObjective(sb, manifest);
        AppendArchitectureOverview(sb, manifest);
        AppendComponentBreakdown(sb, manifest);
        AppendDataFlow(sb, manifest);
        AppendSecurityModel(sb, manifest);
        AppendOperationalConsiderations(sb, manifest);
    }

    private static void AppendObjective(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Objective");

        CoreManifestMetadata metadata = manifest.Metadata ?? new CoreManifestMetadata();
        string? summaryRaw = metadata.Summary;

        if (summaryRaw is null)
        {
            sb.AppendLine("Objective was not stored.");
        }
        else if (summaryRaw.Trim().Length > 0)
        {
            sb.AppendLine(summaryRaw.Trim());
        }
        else
        {
            sb.AppendLine("Objective was stored empty.");
        }

        sb.AppendLine();
    }

    private static void AppendArchitectureOverview(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Architecture Overview");

        if (manifest.Topology is null)
        {
            sb.AppendLine("Topology section was not stored.");
            sb.AppendLine();
            return;
        }

        TopologySection topology = manifest.Topology;
        int written = 0;

        written += AppendStoredTopologyStringList(
            sb,
            topology.SelectedPatterns,
            "Selected patterns were not stored.",
            "Selected patterns were stored as an empty list.",
            "Pattern");
        written += AppendStoredTopologyStringList(
            sb,
            topology.Resources,
            "Resources were not stored.",
            "Resources were stored as an empty list.",
            "Resource");
        written += AppendStoredTopologyServicesOverview(sb, topology.Services);
        written += AppendStoredTopologyDatastoresOverview(sb, topology.Datastores);

        if (written == 0)
            sb.AppendLine("No architecture overview was recorded.");

        sb.AppendLine();
    }

    private static void AppendComponentBreakdown(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Component Breakdown");

        if (manifest.Topology is null)
        {
            sb.AppendLine("Topology section was not stored.");
            sb.AppendLine();
            return;
        }

        TopologySection topology = manifest.Topology;
        int written = 0;

        written += AppendStoredTopologyServicesBreakdown(sb, topology.Services);
        written += AppendStoredTopologyDatastores(sb, topology.Datastores);

        written += AppendStoredTopologyStringList(
            sb,
            topology.Resources,
            "Resources were not stored.",
            "Resources were stored as an empty list.",
            "Resource");

        if (written == 0)
            sb.AppendLine("No components were recorded.");

        sb.AppendLine();
    }

    private static void AppendDataFlow(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Data Flow");

        if (manifest.Topology is null)
        {
            sb.AppendLine("Topology section was not stored.");
            sb.AppendLine();
            return;
        }

        TopologySection topology = manifest.Topology;
        int written = 0;

        written += AppendStoredTopologyRelationships(sb, topology, topology.Relationships);

        written += AppendStoredTopologyStringList(
            sb,
            topology.Gaps,
            "Topology gaps were not stored.",
            "Topology gaps were stored as an empty list.",
            "Topology gap");

        if (written == 0)
            sb.AppendLine("No data flow was recorded.");

        sb.AppendLine();
    }

    private static void AppendSecurityModel(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Security Model");

        if (manifest.Security is null)
        {
            sb.AppendLine("Security section was not stored.");
            sb.AppendLine();
            return;
        }

        SecuritySection security = manifest.Security;
        int written = 0;

        written += AppendStoredSecurityControls(sb, security.Controls);

        foreach (SecurityPostureItem? control in security.Controls ?? [])
        {
            if (control is null)
            {
                sb.AppendLine("- Control was not stored.");
                written++;
                continue;
            }

            string controlId = string.IsNullOrWhiteSpace(control.ControlId)
                ? "Control id was not stored."
                : control.ControlId.Trim();
            string controlName = string.IsNullOrWhiteSpace(control.ControlName)
                ? "Control name was not stored."
                : control.ControlName.Trim();
            string impact = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                control.Impact,
                ArchitectureManifestNarrativeHonestyCopy.ImpactNotStored,
                ArchitectureManifestNarrativeHonestyCopy.ImpactStoredEmpty);
            string status = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                control.Status,
                ArchitectureManifestNarrativeHonestyCopy.StatusNotStored,
                ArchitectureManifestNarrativeHonestyCopy.StatusStoredEmpty);
            sb.AppendLine($"- {controlId} {controlName} ({impact}): {status}");
            written++;
        }

        written += AppendStoredTopologyStringList(
            sb,
            security.Gaps,
            "Security gaps were not stored.",
            "Security gaps were stored as an empty list.",
            "Security gap");

        if (written == 0)
            sb.AppendLine("No security model was recorded.");

        sb.AppendLine();
    }

    private static void AppendOperationalConsiderations(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Operational Considerations");

        CostSection? costSection = manifest.Cost;
        UnresolvedIssuesSection? issuesSection = manifest.UnresolvedIssues;
        int written = 0;

        if (costSection is null && issuesSection is null)
        {
            sb.AppendLine("- Cost and unresolved issues were not stored.");
            written++;
        }
        else
        {
            CostSection cost = costSection ?? new CostSection();
            UnresolvedIssuesSection issues = issuesSection ?? new UnresolvedIssuesSection();

            if (costSection is null)
            {
                sb.AppendLine("- Cost section was not stored.");
                written++;
            }
            else if (cost.MaxMonthlyCost.HasValue)
            {
                sb.AppendLine($"- Max Monthly Cost: {cost.MaxMonthlyCost.Value.ToString("0.00")}");
                written++;
            }
            else
            {
                sb.AppendLine("- Max Monthly Cost: Max monthly cost was not stored.");
                written++;
            }

            if (costSection is not null)
            {
                sb.AppendLine(
                    $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatCostCurrency(cost.CurrencyCode)}");
                written++;
                written += AppendStoredCostStringList(
                    sb,
                    cost.CostRisks,
                    "Cost risks were not stored.",
                    "Cost risks were stored as an empty list.",
                    "Cost risk");
                written += AppendStoredCostStringList(
                    sb,
                    cost.Notes,
                    "Cost notes were not stored.",
                    "Cost notes were stored as an empty list.",
                    "Cost note");
            }

            if (issuesSection is null)
            {
                if (costSection is not null)
                {
                    sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored}");
                    written++;
                }
            }
            else if (issues.Items is null)
            {
                sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesNotStored}");
                written++;
            }
            else if (issues.Items.Count == 0)
            {
                sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.UnresolvedIssuesStoredEmpty}");
                written++;
            }
            else
            {
                foreach (ManifestIssue issue in issues.Items.Where(static i => i is not null))
                {
                    string severity = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        issue.Severity,
                        ArchitectureManifestNarrativeHonestyCopy.IssueSeverityNotStored,
                        "Severity was stored empty.");
                    string issueType = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        issue.IssueType,
                        ArchitectureManifestNarrativeHonestyCopy.IssueTypeNotStored,
                        "Issue type was stored empty.");
                    string issueTitle = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        issue.Title,
                        ArchitectureManifestNarrativeHonestyCopy.IssueTitleNotStored,
                        "Issue title was stored empty.");
                    string issueDescription = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        issue.Description,
                        ArchitectureManifestNarrativeHonestyCopy.IssueDescriptionNotStored,
                        "Issue description was stored empty.");
                    sb.AppendLine($"- [{severity}] {issueType} {issueTitle}: {issueDescription}");
                    written++;
                }
            }
        }

        written += AppendOperationalComplianceConsiderations(sb, manifest.Compliance);

        if (written == 0)
            sb.AppendLine("No operational considerations were recorded.");

        sb.AppendLine();
    }

    private static int AppendOperationalComplianceConsiderations(StringBuilder sb, ComplianceSection? compliance)
    {
        if (compliance is null)
        {
            sb.AppendLine("- Compliance posture was not stored.");
            return 1;
        }

        StringBuilder complianceSection = new();
        ManifestPostureListHonesty.AppendCompliancePostureSection(complianceSection, compliance, referenceStyle: false);
        string complianceText = complianceSection.ToString().TrimEnd();

        if (complianceText.Length == 0)
        {
            sb.AppendLine("- Compliance posture was stored empty.");
            return 1;
        }

        foreach (string line in complianceText.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            string trimmed = line.Trim();

            if (trimmed.Length == 0)
            {
                continue;
            }

            sb.AppendLine(trimmed.StartsWith("- ", StringComparison.Ordinal) ? trimmed : $"- {trimmed}");
        }

        return 1;
    }

    private static int AppendNonEmptyBullets(StringBuilder sb, IEnumerable<string>? values, string label)
    {
        int written = 0;

        foreach (string value in values ?? [])
        {
            if (value is null)
            {
                sb.AppendLine($"- {label} was not stored.");
                written++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(value))
            {
                sb.AppendLine($"- {label} was stored empty.");
                written++;
                continue;
            }

            sb.AppendLine($"- {label}: {value.Trim()}");
            written++;
        }

        return written;
    }

    private static int AppendStoredTopologyStringList(
        StringBuilder sb,
        IList<string>? values,
        string notStoredCopy,
        string emptyListCopy,
        string bulletLabel)
    {
        if (values is null)
        {
            sb.AppendLine($"- {notStoredCopy}");
            return 1;
        }

        if (values.Count == 0)
        {
            sb.AppendLine($"- {emptyListCopy}");
            return 1;
        }

        return AppendNonEmptyBullets(sb, values, bulletLabel);
    }

    private static int AppendStoredCostStringList(
        StringBuilder sb,
        IList<string>? values,
        string notStoredCopy,
        string emptyListCopy,
        string bulletLabel)
    {
        if (values is null)
        {
            sb.AppendLine($"- {notStoredCopy}");
            return 1;
        }

        if (values.Count == 0)
        {
            sb.AppendLine($"- {emptyListCopy}");
            return 1;
        }

        return AppendNonEmptyBullets(sb, values, bulletLabel);
    }

    private static string FormatServicePurposeSuffix(string? purpose)
    {
        if (purpose is null)
            return " — Service purpose was not stored.";

        if (purpose.Trim().Length == 0)
            return " — Service purpose was stored empty.";

        return $" — {purpose.Trim()}";
    }

    private static string FormatRelationshipDescriptionSuffix(string? description)
    {
        if (description is null)
            return " — Relationship description was not stored.";

        if (description.Trim().Length == 0)
            return " — Relationship description was stored empty.";

        return $" — {description.Trim()}";
    }

    private static string FormatServiceType(ServiceType serviceType) =>
        serviceType == ServiceType.Unknown ? "Service type was not stored." : serviceType.ToString();

    private static string FormatDatastoreType(DatastoreType datastoreType) =>
        datastoreType == DatastoreType.Unknown ? "Datastore type was not stored." : datastoreType.ToString();

    private static string FormatRuntimePlatform(RuntimePlatform runtimePlatform) =>
        runtimePlatform == RuntimePlatform.Unknown ? "Runtime platform was not stored." : runtimePlatform.ToString();

    private static string FormatRelationshipType(RelationshipType relationshipType) =>
        Enum.IsDefined(relationshipType) && relationshipType != default
            ? relationshipType.ToString()
            : "Relationship type was not stored.";

    private static string FormatComponentName(string? name, string notStoredCopy, string storedEmptyCopy)
    {
        if (name is null)
            return notStoredCopy;

        if (name.Trim().Length == 0)
            return storedEmptyCopy;

        return name.Trim();
    }

    private static string FormatTopologyEndpointLabel(
        TopologySection topology,
        string? endpointId,
        string missingIdCopy)
    {
        if (endpointId is null)
            return missingIdCopy;

        if (endpointId.Length == 0 || string.IsNullOrWhiteSpace(endpointId))
            return "Relationship endpoint id was stored empty.";

        string id = endpointId.Trim();

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            if (!string.Equals(service.ServiceId?.Trim(), id, StringComparison.OrdinalIgnoreCase))
                continue;

            if (service.ServiceName is null)
                return $"{id} (service name was not stored.)";

            if (service.ServiceName.Trim().Length == 0)
                return $"{id} (service name was stored empty.)";

            return service.ServiceName.Trim();
        }

        foreach (ManifestDatastore datastore in (topology.Datastores ?? []).Where(static d => d is not null))
        {
            if (!string.Equals(datastore.DatastoreId?.Trim(), id, StringComparison.OrdinalIgnoreCase))
                continue;

            if (datastore.DatastoreName is null)
                return $"{id} (datastore name was not stored.)";

            if (datastore.DatastoreName.Trim().Length == 0)
                return $"{id} (datastore name was stored empty.)";

            return datastore.DatastoreName.Trim();
        }

        return $"{id} (endpoint id did not match a stored service or datastore.)";
    }

    private static int AppendStoredTopologyServicesOverview(StringBuilder sb, IList<ManifestService>? services)
    {
        if (services is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesNotStored}");
            return 1;
        }

        if (services.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesStoredEmpty}");
            return 1;
        }

        int written = 0;

        foreach (ManifestService? service in services)
        {
            if (service is null)
            {
                sb.AppendLine("- Service was not stored.");
                written++;
                continue;
            }

            string serviceName = FormatComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
            sb.AppendLine(
                $"- Service: {serviceName} ({FormatServiceType(service.ServiceType)}){FormatServicePurposeSuffix(service.Purpose)}");
            written++;
        }

        return written;
    }

    private static int AppendStoredTopologyDatastoresOverview(StringBuilder sb, IList<ManifestDatastore>? datastores)
    {
        if (datastores is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresNotStored}");
            return 1;
        }

        if (datastores.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresStoredEmpty}");
            return 1;
        }

        int written = 0;

        foreach (ManifestDatastore? datastore in datastores)
        {
            if (datastore is null)
            {
                sb.AppendLine("- Datastore was not stored.");
                written++;
                continue;
            }

            string datastoreName = FormatComponentName(
                datastore.DatastoreName,
                "Datastore name was not stored.",
                "Datastore name was stored empty.");
            sb.AppendLine(
                $"- Datastore: {datastoreName} ({FormatDatastoreType(datastore.DatastoreType)})");
            written++;
        }

        return written;
    }

    private static int AppendStoredTopologyServicesBreakdown(StringBuilder sb, IList<ManifestService>? services)
    {
        if (services is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesNotStored}");
            return 1;
        }

        if (services.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.ServicesStoredEmpty}");
            return 1;
        }

        int written = 0;

        foreach (ManifestService? service in services)
        {
            if (service is null)
            {
                sb.AppendLine("- Service was not stored.");
                written++;
                continue;
            }

            string serviceName = FormatComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
            sb.AppendLine(
                $"- Service: {serviceName} ({FormatServiceType(service.ServiceType)}, {FormatRuntimePlatform(service.RuntimePlatform)})");
            written++;
        }

        return written;
    }

    private static int AppendStoredTopologyDatastores(StringBuilder sb, IList<ManifestDatastore>? datastores)
    {
        if (datastores is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresNotStored}");
            return 1;
        }

        if (datastores.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.DatastoresStoredEmpty}");
            return 1;
        }

        int written = 0;

        foreach (ManifestDatastore? datastore in datastores)
        {
            if (datastore is null)
            {
                sb.AppendLine("- Datastore was not stored.");
                written++;
                continue;
            }

            string datastoreName = FormatComponentName(
                datastore.DatastoreName,
                "Datastore name was not stored.",
                "Datastore name was stored empty.");
            sb.AppendLine(
                $"- Datastore: {datastoreName} ({FormatDatastoreType(datastore.DatastoreType)}, {FormatRuntimePlatform(datastore.RuntimePlatform)})");
            written++;
        }

        return written;
    }

    private static int AppendStoredTopologyRelationships(
        StringBuilder sb,
        TopologySection topology,
        IList<ManifestRelationship>? relationships)
    {
        if (relationships is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.RelationshipsNotStored}");
            return 1;
        }

        if (relationships.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.RelationshipsStoredEmpty}");
            return 1;
        }

        int written = 0;

        foreach (ManifestRelationship? relationship in relationships)
        {
            if (relationship is null)
            {
                sb.AppendLine("- Relationship was not stored.");
                written++;
                continue;
            }

            string sourceLabel = FormatTopologyEndpointLabel(topology, relationship.SourceId, "Relationship source id was not stored.");
            string targetLabel = FormatTopologyEndpointLabel(topology, relationship.TargetId, "Relationship target id was not stored.");
            string relationshipType = FormatRelationshipType(relationship.RelationshipType);
            sb.AppendLine(
                $"- Flow: {sourceLabel} -> {targetLabel}. Stored relationship type: {relationshipType}. Observed traffic was not stored.{FormatRelationshipDescriptionSuffix(relationship.Description)}");
            written++;
        }

        return written;
    }

    private static int AppendStoredSecurityControls(StringBuilder sb, IList<SecurityPostureItem>? controls)
    {
        if (controls is null)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.SecurityControlsNotStored}");
            return 1;
        }

        if (controls.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureManifestNarrativeHonestyCopy.SecurityControlsStoredEmpty}");
            return 1;
        }

        return 0;
    }
}
