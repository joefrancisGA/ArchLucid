using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Indexes topology proposal service/datastore names and ids for relationship endpoint validation.
/// </summary>
public static class TopologyProposalRelationshipEndpointIndex
{
    public static HashSet<string> CollectKnownEndpointKeys(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores)
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ManifestService service in services)
        {
            AddEndpointKey(knownEndpointKeys, service.ServiceName);
            AddEndpointKey(knownEndpointKeys, service.ServiceId);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            AddEndpointKey(knownEndpointKeys, datastore.DatastoreName);
            AddEndpointKey(knownEndpointKeys, datastore.DatastoreId);
        }

        return knownEndpointKeys;
    }

    public static List<ManifestRelationship> FilterKnownRelationships(
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship>? relationships)
    {
        if (relationships is null || relationships.Count == 0)
            return [];

        HashSet<string> knownEndpointKeys = CollectKnownEndpointKeys(services, datastores);
        List<ManifestRelationship> sanitized = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!RelationshipEndpointsAreKnown(relationship, knownEndpointKeys))
                continue;

            sanitized.Add(relationship);
        }

        return sanitized;
    }

    public static bool RelationshipEndpointsAreKnown(
        ManifestRelationship relationship,
        HashSet<string> knownEndpointKeys) =>
        knownEndpointKeys.Contains(relationship.SourceId)
        && knownEndpointKeys.Contains(relationship.TargetId);

    private static void AddEndpointKey(HashSet<string> knownEndpointKeys, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            knownEndpointKeys.Add(value);
    }
}
