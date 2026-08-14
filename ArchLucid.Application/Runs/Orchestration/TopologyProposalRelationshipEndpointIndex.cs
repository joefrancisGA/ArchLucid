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
        IReadOnlyList<ManifestRelationship>? relationships) =>
        FilterKnownRelationships(null, services, datastores, relationships);

    public static List<ManifestRelationship> FilterKnownRelationships(
        IEnumerable<string>? additionalEndpointKeys,
        IReadOnlyList<ManifestService> services,
        IReadOnlyList<ManifestDatastore> datastores,
        IReadOnlyList<ManifestRelationship>? relationships)
    {
        if (relationships is null || relationships.Count == 0)
            return [];

        HashSet<string> knownEndpointKeys = CollectKnownEndpointKeys(services, datastores);

        if (additionalEndpointKeys is not null)
        {
            foreach (string endpointKey in additionalEndpointKeys)
            {
                AddEndpointKey(knownEndpointKeys, endpointKey);
            }
        }

        List<ManifestRelationship> sanitized = [];

        foreach (ManifestRelationship relationship in relationships)
        {
            if (!RelationshipEndpointsAreKnown(relationship, knownEndpointKeys))
                continue;

            sanitized.Add(relationship);
        }

        return sanitized;
    }

    public static bool TryClaimService(ManifestService service, HashSet<string> claimedEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(service.ServiceName) && string.IsNullOrWhiteSpace(service.ServiceId))
            return false;

        if (EndpointKeyIsClaimed(service.ServiceName, claimedEndpointKeys)
            || EndpointKeyIsClaimed(service.ServiceId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, service.ServiceName);
        AddEndpointKey(claimedEndpointKeys, service.ServiceId);

        return true;
    }

    public static bool TryClaimDatastore(ManifestDatastore datastore, HashSet<string> claimedEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(datastore.DatastoreName) && string.IsNullOrWhiteSpace(datastore.DatastoreId))
            return false;

        if (EndpointKeyIsClaimed(datastore.DatastoreName, claimedEndpointKeys)
            || EndpointKeyIsClaimed(datastore.DatastoreId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, datastore.DatastoreName);
        AddEndpointKey(claimedEndpointKeys, datastore.DatastoreId);

        return true;
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

    private static bool EndpointKeyIsClaimed(string? value, HashSet<string> claimedEndpointKeys) =>
        !string.IsNullOrWhiteSpace(value) && claimedEndpointKeys.Contains(value);
}
