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

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            string serviceName = FormatComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
            sb.AppendLine(
                $"- Service: {serviceName} ({FormatServiceType(service.ServiceType)}){FormatServicePurposeSuffix(service.Purpose)}");
            written++;
        }

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

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            string serviceName = FormatComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
            sb.AppendLine(
                $"- Service: {serviceName} ({FormatServiceType(service.ServiceType)}, {FormatRuntimePlatform(service.RuntimePlatform)})");
            written++;
        }

        foreach (ManifestDatastore datastore in (topology.Datastores ?? []).Where(static d => d is not null))
        {
            string datastoreName = FormatComponentName(
                datastore.DatastoreName,
                "Datastore name was not stored.",
                "Datastore name was stored empty.");
            sb.AppendLine(
                $"- Datastore: {datastoreName} ({FormatDatastoreType(datastore.DatastoreType)}, {FormatRuntimePlatform(datastore.RuntimePlatform)})");
            written++;
        }

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

        foreach (ManifestRelationship relationship in (topology.Relationships ?? []).Where(static r => r is not null))
        {
            string sourceLabel = FormatTopologyEndpointLabel(topology, relationship.SourceId, "Relationship source id was not stored.");
            string targetLabel = FormatTopologyEndpointLabel(topology, relationship.TargetId, "Relationship target id was not stored.");
            string relationshipType = FormatRelationshipType(relationship.RelationshipType);
            sb.AppendLine(
                $"- Flow: {sourceLabel} -> {targetLabel}. Stored relationship type: {relationshipType}. Observed traffic was not stored.{FormatRelationshipDescriptionSuffix(relationship.Description)}");
            written++;
        }

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

        foreach (SecurityPostureItem control in (security.Controls ?? []).Where(static c => c is not null))
        {
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

        if (manifest.Cost is null && manifest.UnresolvedIssues is null)
        {
            sb.AppendLine("Operational considerations were not stored.");
            sb.AppendLine();
            return;
        }

        CostSection cost = manifest.Cost ?? new CostSection();
        UnresolvedIssuesSection issues = manifest.UnresolvedIssues ?? new UnresolvedIssuesSection();
        int written = 0;

        if (cost.MaxMonthlyCost.HasValue)
        {
            sb.AppendLine($"- Max Monthly Cost: {cost.MaxMonthlyCost.Value.ToString("0.00")}");
            written++;
        }
        else if (manifest.Cost is not null)
        {
            sb.AppendLine("- Max Monthly Cost: Max monthly cost was not stored.");
            written++;
        }

        if (manifest.Cost is not null)
        {
            sb.AppendLine(
                $"- Cost Currency: {ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(cost.CurrencyCode, ArchitectureManifestNarrativeHonestyCopy.CostCurrencyNotStored)}");
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

        foreach (ManifestIssue issue in (issues.Items ?? []).Where(static i => i is not null))
        {
            string severity = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                issue.Severity,
                ArchitectureManifestNarrativeHonestyCopy.IssueSeverityNotStored);
            string issueType = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                issue.IssueType,
                ArchitectureManifestNarrativeHonestyCopy.IssueTypeNotStored);
            string issueTitle = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                issue.Title,
                ArchitectureManifestNarrativeHonestyCopy.IssueTitleNotStored);
            string issueDescription = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                issue.Description,
                ArchitectureManifestNarrativeHonestyCopy.IssueDescriptionNotStored);
            sb.AppendLine($"- [{severity}] {issueType} {issueTitle}: {issueDescription}");
            written++;
        }

        if (written == 0)
            sb.AppendLine("No operational considerations were recorded.");

        sb.AppendLine();
    }

    private static int AppendNonEmptyBullets(StringBuilder sb, IEnumerable<string>? values, string label)
    {
        int written = 0;

        foreach (string value in values ?? [])
        {
            if (value is null)
            {
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
        if (string.IsNullOrWhiteSpace(endpointId))
            return missingIdCopy;

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

        return id;
    }
}
