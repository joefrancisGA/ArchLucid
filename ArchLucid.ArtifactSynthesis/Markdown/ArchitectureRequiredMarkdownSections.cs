using System.Text;

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
        string summary = metadata.Summary?.Trim() ?? string.Empty;
        string name = metadata.Name?.Trim() ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(summary))
            sb.AppendLine(summary);
        else if (!string.IsNullOrWhiteSpace(name))
            sb.AppendLine($"Recorded review objective: {name}.");
        else
            sb.AppendLine("No objective was recorded.");

        sb.AppendLine();
    }

    private static void AppendArchitectureOverview(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Architecture Overview");

        TopologySection topology = manifest.Topology ?? new TopologySection();
        int written = 0;

        written += AppendNonEmptyBullets(sb, topology.SelectedPatterns, "Pattern");
        written += AppendNonEmptyBullets(sb, topology.Resources, "Resource");

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            string serviceName = service.ServiceName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(serviceName))
                continue;

            string purpose = string.IsNullOrWhiteSpace(service.Purpose)
                ? string.Empty
                : $" — {service.Purpose.Trim()}";
            sb.AppendLine($"- Service: {serviceName} ({service.ServiceType}){purpose}");
            written++;
        }

        if (written == 0)
            sb.AppendLine("No architecture overview was recorded.");

        sb.AppendLine();
    }

    private static void AppendComponentBreakdown(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Component Breakdown");

        TopologySection topology = manifest.Topology ?? new TopologySection();
        int written = 0;

        foreach (ManifestService service in (topology.Services ?? []).Where(static s => s is not null))
        {
            string serviceName = service.ServiceName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(serviceName))
                continue;

            sb.AppendLine($"- Service: {serviceName} ({service.ServiceType}, {service.RuntimePlatform})");
            written++;
        }

        foreach (ManifestDatastore datastore in (topology.Datastores ?? []).Where(static d => d is not null))
        {
            string datastoreName = datastore.DatastoreName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(datastoreName))
                continue;

            sb.AppendLine($"- Datastore: {datastoreName} ({datastore.DatastoreType}, {datastore.RuntimePlatform})");
            written++;
        }

        written += AppendNonEmptyBullets(sb, topology.Resources, "Resource");

        if (written == 0)
            sb.AppendLine("No components were recorded.");

        sb.AppendLine();
    }

    private static void AppendDataFlow(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Data Flow");

        TopologySection topology = manifest.Topology ?? new TopologySection();
        int written = 0;

        foreach (ManifestRelationship relationship in (topology.Relationships ?? []).Where(static r => r is not null))
        {
            string sourceId = relationship.SourceId?.Trim() ?? string.Empty;
            string targetId = relationship.TargetId?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(sourceId) || string.IsNullOrWhiteSpace(targetId))
                continue;

            string description = string.IsNullOrWhiteSpace(relationship.Description)
                ? string.Empty
                : $" — {relationship.Description.Trim()}";
            sb.AppendLine($"- Flow: {sourceId} -> {targetId} ({relationship.RelationshipType}){description}");
            written++;
        }

        // Private-beta manifests often have resource names before typed edges exist; keep the
        // required heading honest instead of emitting an empty "no data flow" line.
        written += AppendNonEmptyBullets(sb, topology.Resources, "Data-plane resource");
        written += AppendNonEmptyBullets(sb, topology.Gaps, "Topology gap");

        if (written == 0)
            sb.AppendLine("No data flow was recorded.");

        sb.AppendLine();
    }

    private static void AppendSecurityModel(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Security Model");

        SecuritySection security = manifest.Security ?? new SecuritySection();
        int written = 0;

        foreach (SecurityPostureItem control in (security.Controls ?? []).Where(static c => c is not null))
        {
            string controlName = control.ControlName?.Trim() ?? string.Empty;
            string controlId = control.ControlId?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(controlName) && string.IsNullOrWhiteSpace(controlId))
                continue;

            sb.AppendLine($"- {controlId} {controlName} ({control.Impact}): {control.Status}");
            written++;
        }

        written += AppendNonEmptyBullets(sb, security.Gaps, "Security gap");

        if (written == 0)
            sb.AppendLine("No security model was recorded.");

        sb.AppendLine();
    }

    private static void AppendOperationalConsiderations(StringBuilder sb, ManifestDocument manifest)
    {
        sb.AppendLine("## Operational Considerations");

        CostSection cost = manifest.Cost ?? new CostSection();
        UnresolvedIssuesSection issues = manifest.UnresolvedIssues ?? new UnresolvedIssuesSection();
        int written = 0;

        if (cost.MaxMonthlyCost.HasValue)
        {
            sb.AppendLine($"- Max Monthly Cost: {cost.MaxMonthlyCost.Value.ToString("0.00")}");
            written++;
        }

        written += AppendNonEmptyBullets(sb, cost.CostRisks, "Cost risk");
        written += AppendNonEmptyBullets(sb, cost.Notes, "Cost note");

        foreach (ManifestIssue issue in (issues.Items ?? []).Where(static i => i is not null))
        {
            string title = issue.Title?.Trim() ?? string.Empty;
            string description = issue.Description?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(description))
                continue;

            sb.AppendLine($"- [{issue.Severity}] {issue.IssueType} {title}: {description}");
            written++;
        }

        if (written == 0)
            sb.AppendLine("No operational considerations were recorded.");

        sb.AppendLine();
    }

    private static int AppendNonEmptyBullets(StringBuilder sb, IEnumerable<string>? values, string label)
    {
        int written = 0;

        foreach (string value in (values ?? []).Where(static v => !string.IsNullOrWhiteSpace(v)))
        {
            sb.AppendLine($"- {label}: {value.Trim()}");
            written++;
        }

        return written;
    }
}
