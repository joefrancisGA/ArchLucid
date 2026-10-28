using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Manifests;

/// <summary>
///     Presentation-layer helpers for resolving human-readable names and labels from manifest data.
/// </summary>
public static class ManifestPresentation
{
    /// <summary>
    ///     Resolves a component identifier to its display name by looking up services and datastores in
    ///     <paramref name="manifest"/>. Returns <paramref name="componentId"/> unchanged when no match is found.
    /// </summary>
    public static string ResolveComponentName(string componentId, GoldenManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(componentId);
        ArgumentNullException.ThrowIfNull(manifest);
        if (string.IsNullOrWhiteSpace(componentId))
            return ArchitectureManifestMarkdownSummaryExport.ComponentNameNotStored;
        ManifestService? service = manifest.Services.FirstOrDefault(s => s.ServiceId.Equals(componentId, StringComparison.OrdinalIgnoreCase));
        if (service is not null)
        {
            return FormatStoredComponentName(service.ServiceName, "Service name was not stored.", "Service name was stored empty.");
        }

        ManifestDatastore? datastore = manifest.Datastores.FirstOrDefault(d => d.DatastoreId.Equals(componentId, StringComparison.OrdinalIgnoreCase));
        if (datastore is not null)
        {
            return FormatStoredComponentName(
                datastore.DatastoreName,
                "Datastore name was not stored.",
                "Datastore name was stored empty.");
        }

        return ArchitectureManifestMarkdownSummaryExport.ComponentNameNotStored;
    }

    private static string FormatStoredComponentName(string? name, string notStoredCopy, string storedEmptyCopy)
    {
        if (name is null)
            return notStoredCopy;

        if (name.Length == 0)
            return storedEmptyCopy;

        if (string.IsNullOrWhiteSpace(name))
            return storedEmptyCopy;

        return name.Trim();
    }

    /// <summary>
    ///     Returns a concise lowercase label for a <see cref="RelationshipType"/> suitable for diagram annotations
    ///     (e.g. <c>"calls"</c>, <c>"reads"</c>). Falls back to <see cref="Enum.ToString()"/> for unmapped values.
    /// </summary>
    public static string RelationshipLabel(RelationshipType relationshipType)
    {
        return relationshipType switch
        {
            RelationshipType.Calls => "calls",
            RelationshipType.ReadsFrom => "reads",
            RelationshipType.WritesTo => "writes",
            RelationshipType.PublishesTo => "publishes",
            RelationshipType.SubscribesTo => "subscribes",
            RelationshipType.AuthenticatesWith => "auth",
            _ => relationshipType.ToString()
        };
    }
}
