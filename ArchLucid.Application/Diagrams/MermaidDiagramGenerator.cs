using System.Text;

using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Diagrams;

/// <summary>
///     Fixed-layout Mermaid diagram generator that uses opinionated defaults (LR flowchart, runtime-platform
///     node labels, relationship-type edge labels). For configurable rendering use
///     <see cref="ManifestDiagramService" /> with <see cref="ManifestDiagramOptions" /> instead.
/// </summary>
public sealed class MermaidDiagramGenerator : IDiagramGenerator
{
    /// <inheritdoc />
    public string GenerateMermaid(GoldenManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        StringBuilder sb = new();

        sb.AppendLine("flowchart LR");

        string servicesBlock = string.Join(Environment.NewLine, manifest.Services.OrderBy(s => s.ServiceName)
            .Select(service =>
                $"    {SanitizeId(service.ServiceId)}[{EscapeLabel(BuildServiceLabel(service))}]"));

        if (servicesBlock.Length > 0)
            sb.AppendLine(servicesBlock);

        string datastoreBlock = string.Join(Environment.NewLine, manifest.Datastores.OrderBy(d => d.DatastoreName)
            .Select(datastore =>
                $"    {SanitizeId(datastore.DatastoreId)}[(\"{EscapeLabel(BuildDatastoreLabel(datastore))}\")]"));

        if (datastoreBlock.Length > 0)
            sb.AppendLine(datastoreBlock);

        string relationshipBlock = string.Join(Environment.NewLine, manifest.Relationships.OrderBy(r => r.SourceId)
            .ThenBy(r => r.TargetId)
            .Select(relationship =>
            {
                string source = SanitizeId(relationship.SourceId);
                string target = SanitizeId(relationship.TargetId);
                string label = EscapeLabel(BuildRelationshipLabel(relationship));

                return $"    {source} -->|{label}| {target}";
            }));

        if (relationshipBlock.Length > 0)
            sb.AppendLine(relationshipBlock);

        return sb.ToString();
    }

    private static string BuildServiceLabel(ManifestService service)
    {
        string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
            ? ManifestDiagramHonestyCopy.ServiceNameNotStored
            : service.ServiceName.Trim();
        string platformLabel = ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform);
        return $"{serviceName}\\n{platformLabel}";
    }

    private static string BuildDatastoreLabel(ManifestDatastore datastore)
    {
        string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
            ? ManifestDiagramHonestyCopy.DatastoreNameNotStored
            : datastore.DatastoreName.Trim();
        string platformLabel = ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform);
        string privateEndpointLine = datastore.PrivateEndpointRequired
            ? ArchitectureManifestDatastoreExport.PrivateEndpointRequiredOmissionLabel
            : ArchitectureManifestDatastoreExport.PrivateEndpointRequirementNotStoredLabel;
        return $"{datastoreName}\\n{platformLabel}\\n{privateEndpointLine}";
    }

    private static string BuildRelationshipLabel(ManifestRelationship relationship)
    {
        if (!Enum.IsDefined(relationship.RelationshipType))
            return ManifestDiagramHonestyCopy.RelationshipTypeNotStored;

        return ArchitectureManifestMarkdownSummaryExport.FormatRelationshipTypeForSummary(relationship.RelationshipType);
    }

    private static string SanitizeId(string value)
    {
        return DiagramIdSanitizer.Sanitize(value);
    }

    private static string EscapeLabel(string value)
    {
        return value
            .Replace("\"", "'")
            .Replace("[", "(")
            .Replace("]", ")")
            .Replace("{", "(")
            .Replace("}", ")");
    }
}
