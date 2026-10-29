using System.Text;

using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Summaries;

/// <summary>
///     Options-driven Markdown summary of a <see cref = "GoldenManifest"/>.
///     Unlike <see cref = "MarkdownManifestSummaryGenerator"/>, this service is evidence-agnostic
///     and controlled by <see cref = "ManifestSummaryOptions"/> for selective section inclusion.
/// </summary>
public sealed class ManifestSummaryService : IManifestSummaryService
{
    /// <inheritdoc/>
    public string GenerateMarkdown(GoldenManifest manifest, ManifestSummaryOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        options ??= ManifestSummaryOptions.Default;
        ManifestGovernance governance = manifest.Governance;
        ManifestMetadata metadata = manifest.Metadata;
        List<ManifestService> services = manifest.Services;
        List<ManifestDatastore> datastores = manifest.Datastores;
        List<ManifestRelationship> relationships = manifest.Relationships;
        StringBuilder sb = new();
        string systemName = ArchitectureManifestMarkdownSummaryExport.FormatSystemNameForSummary(manifest.SystemName);
        sb.AppendLine($"# Architecture Summary: {systemName}");
        sb.AppendLine();
        sb.AppendLine("## Overview");
        sb.AppendLine();
        sb.AppendLine($"- **System Name:** {systemName}");
        sb.AppendLine(
            $"- **Manifest Version:** {ArchitectureManifestMarkdownSummaryExport.FormatManifestVersionForSummary(metadata.ManifestVersion)}");
        sb.AppendLine(
            $"- **Service Count:** {ArchitectureManifestMarkdownSummaryExport.FormatSnapshotServiceCountPhrase(services.Count)}");
        sb.AppendLine(
            $"- **Datastore Count:** {ArchitectureManifestMarkdownSummaryExport.FormatSnapshotDatastoreCountPhrase(datastores.Count)}");
        sb.AppendLine(
            $"- **Relationship Count:** {ArchitectureManifestMarkdownSummaryExport.FormatSnapshotRelationshipCountPhrase(relationships.Count)}");
        sb.AppendLine();
        if (options.IncludeRequiredControls && governance.RequiredControls.Count > 0)
        {
            sb.AppendLine("## Required Controls");
            sb.AppendLine();
            foreach (string control in governance.RequiredControls.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
                sb.AppendLine($"- {control}");
            sb.AppendLine();
        }

        if (services.Count > 0)
        {
            sb.AppendLine("## Services");
            sb.AppendLine();
            foreach (ManifestService service in services.OrderBy(s => s.ServiceName, StringComparer.OrdinalIgnoreCase))
            {
                string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
                    ? "Service name was not stored."
                    : service.ServiceName.Trim();
                sb.AppendLine($"### {serviceName}");
                sb.AppendLine();
                sb.AppendLine($"- **Service Type:** {ArchitectureManifestTopologyExport.FormatServiceTypeForExport(service.ServiceType)}");
                sb.AppendLine($"- **Runtime Platform:** {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform)}");
                sb.AppendLine(
                    $"- **Purpose:** {(string.IsNullOrWhiteSpace(service.Purpose) ? "Purpose was not stored." : service.Purpose.Trim())}");
                if (options.IncludeComponentControls)
                {
                    sb.AppendLine(
                        service.RequiredControls.Count > 0
                            ? $"- **Required Controls:** {string.Join(", ", service.RequiredControls.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))}"
                            : $"- **Required Controls:** {ArchitectureManifestMarkdownSummaryExport.RequiredControlsNotStored}");
                }

                if (options.IncludeTags)
                {
                    sb.AppendLine(
                        service.Tags.Count > 0
                            ? $"- **Tags:** {string.Join(", ", service.Tags.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))}"
                            : $"- **Tags:** {ArchitectureManifestMarkdownSummaryExport.TagsNotStored}");
                }
                sb.AppendLine();
            }
        }

        if (datastores.Count > 0)
        {
            sb.AppendLine("## Datastores");
            sb.AppendLine();
            foreach (ManifestDatastore datastore in datastores.OrderBy(d => d.DatastoreName, StringComparer.OrdinalIgnoreCase))
            {
                string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
                    ? "Datastore name was not stored."
                    : datastore.DatastoreName.Trim();
                sb.AppendLine($"### {datastoreName}");
                sb.AppendLine();
                sb.AppendLine($"- **Datastore Type:** {ArchitectureManifestTopologyExport.FormatDatastoreTypeForExport(datastore.DatastoreType)}");
                sb.AppendLine($"- **Runtime Platform:** {ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform)}");
                sb.AppendLine(
                    $"- **Purpose:** {(string.IsNullOrWhiteSpace(datastore.Purpose) ? ArchitectureManifestMarkdownSummaryExport.PurposeNotStored : datastore.Purpose.Trim())}");
                sb.AppendLine($"- **Private Endpoint Required:** {ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(datastore.PrivateEndpointRequired)}");
                sb.AppendLine($"- **Encryption At Rest Required:** {ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(datastore.EncryptionAtRestRequired)}");
                sb.AppendLine();
            }
        }

        if (options.IncludeRelationships && relationships.Count > 0)
        {
            sb.AppendLine("## Relationships");
            sb.AppendLine();
            int max = options.MaxRelationships ?? int.MaxValue;
            foreach (var relationship in relationships
                         .Select(r => new
                         {
                             Relationship = r,
                             SourceName = ManifestPresentation.ResolveComponentName(r.SourceId, manifest),
                             TargetName = ManifestPresentation.ResolveComponentName(r.TargetId, manifest),
                             LinkLabel = ArchitectureManifestMarkdownSummaryExport.FormatRelationshipTypeForSummary(
                                 r.RelationshipType),
                         }).OrderBy(x => x.SourceName, StringComparer.OrdinalIgnoreCase).ThenBy(x => x.TargetName, StringComparer.OrdinalIgnoreCase)
                         .ThenBy(x => x.LinkLabel, StringComparer.OrdinalIgnoreCase).Take(max))
            {
                sb.AppendLine(
                    $"- **{relationship.SourceName}** {relationship.LinkLabel} **{relationship.TargetName}**");
                string description = string.IsNullOrWhiteSpace(relationship.Relationship.Description)
                    ? "Relationship description was not stored."
                    : relationship.Relationship.Description.Trim();
                sb.AppendLine($"  - {description}");
            }

            sb.AppendLine();
        }

        if (!options.IncludeComplianceTags || governance.ComplianceTags.Count <= 0)
            return sb.ToString().TrimEnd();
        sb.AppendLine("## Compliance Tags");
        sb.AppendLine();
        foreach (string tag in governance.ComplianceTags.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
            sb.AppendLine($"- {tag}");
        sb.AppendLine();
        return sb.ToString().TrimEnd();
    }
}
