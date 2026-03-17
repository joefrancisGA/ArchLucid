using System.Text;
using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Summaries;

public sealed class ManifestSummaryService : IManifestSummaryService
{
    public string GenerateMarkdown(GoldenManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        var sb = new StringBuilder();

        sb.AppendLine($"# Architecture Summary: {manifest.SystemName}");
        sb.AppendLine();

        sb.AppendLine("## Overview");
        sb.AppendLine();
        sb.AppendLine($"- **System Name:** {manifest.SystemName}");
        sb.AppendLine($"- **Manifest Version:** {manifest.Metadata.ManifestVersion}");
        sb.AppendLine($"- **Service Count:** {manifest.Services.Count}");
        sb.AppendLine($"- **Datastore Count:** {manifest.Datastores.Count}");
        sb.AppendLine($"- **Relationship Count:** {manifest.Relationships.Count}");
        sb.AppendLine();

        if (manifest.Governance.RequiredControls.Count > 0)
        {
            sb.AppendLine("## Required Controls");
            sb.AppendLine();

            foreach (var control in manifest.Governance.RequiredControls
                         .OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
            {
                sb.AppendLine($"- {control}");
            }

            sb.AppendLine();
        }

        if (manifest.Services.Count > 0)
        {
            sb.AppendLine("## Services");
            sb.AppendLine();

            foreach (var service in manifest.Services.OrderBy(s => s.ServiceName, StringComparer.OrdinalIgnoreCase))
            {
                sb.AppendLine($"### {service.ServiceName}");
                sb.AppendLine();
                sb.AppendLine($"- **Service Type:** {service.ServiceType}");
                sb.AppendLine($"- **Runtime Platform:** {service.RuntimePlatform}");

                if (!string.IsNullOrWhiteSpace(service.Purpose))
                {
                    sb.AppendLine($"- **Purpose:** {service.Purpose}");
                }

                if (service.RequiredControls.Count > 0)
                {
                    sb.AppendLine($"- **Required Controls:** {string.Join(", ", service.RequiredControls.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))}");
                }

                if (service.Tags.Count > 0)
                {
                    sb.AppendLine($"- **Tags:** {string.Join(", ", service.Tags.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))}");
                }

                sb.AppendLine();
            }
        }

        if (manifest.Datastores.Count > 0)
        {
            sb.AppendLine("## Datastores");
            sb.AppendLine();

            foreach (var datastore in manifest.Datastores.OrderBy(d => d.DatastoreName, StringComparer.OrdinalIgnoreCase))
            {
                sb.AppendLine($"### {datastore.DatastoreName}");
                sb.AppendLine();
                sb.AppendLine($"- **Datastore Type:** {datastore.DatastoreType}");
                sb.AppendLine($"- **Runtime Platform:** {datastore.RuntimePlatform}");

                if (!string.IsNullOrWhiteSpace(datastore.Purpose))
                {
                    sb.AppendLine($"- **Purpose:** {datastore.Purpose}");
                }

                sb.AppendLine($"- **Private Endpoint Required:** {(datastore.PrivateEndpointRequired ? "Yes" : "No")}");
                sb.AppendLine($"- **Encryption At Rest Required:** {(datastore.EncryptionAtRestRequired ? "Yes" : "No")}");
                sb.AppendLine();
            }
        }

        if (manifest.Relationships.Count > 0)
        {
            sb.AppendLine("## Relationships");
            sb.AppendLine();

            foreach (var relationship in manifest.Relationships)
            {
                var sourceName = ResolveComponentName(relationship.SourceId, manifest);
                var targetName = ResolveComponentName(relationship.TargetId, manifest);

                sb.AppendLine($"- **{sourceName}** -> **{targetName}** ({relationship.RelationshipType})");

                if (!string.IsNullOrWhiteSpace(relationship.Description))
                {
                    sb.AppendLine($"  - {relationship.Description}");
                }
            }

            sb.AppendLine();
        }

        if (manifest.Governance.ComplianceTags.Count > 0)
        {
            sb.AppendLine("## Compliance Tags");
            sb.AppendLine();

            foreach (var tag in manifest.Governance.ComplianceTags
                         .OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
            {
                sb.AppendLine($"- {tag}");
            }

            sb.AppendLine();
        }

        return sb.ToString().TrimEnd();
    }

    private static string ResolveComponentName(string componentId, GoldenManifest manifest)
    {
        var service = manifest.Services.FirstOrDefault(s =>
            s.ServiceId.Equals(componentId, StringComparison.OrdinalIgnoreCase));

        if (service is not null)
        {
            return service.ServiceName;
        }

        var datastore = manifest.Datastores.FirstOrDefault(d =>
            d.DatastoreId.Equals(componentId, StringComparison.OrdinalIgnoreCase));

        if (datastore is not null)
        {
            return datastore.DatastoreName;
        }

        return componentId;
    }
}

