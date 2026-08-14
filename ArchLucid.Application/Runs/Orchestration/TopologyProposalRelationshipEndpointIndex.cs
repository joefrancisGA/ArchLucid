using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph.Models;

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
            AddSyntheticServiceEndpointKey(knownEndpointKeys, service.ServiceName);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            AddEndpointKey(knownEndpointKeys, datastore.DatastoreName);
            AddEndpointKey(knownEndpointKeys, datastore.DatastoreId);
            AddSyntheticDatastoreEndpointKey(knownEndpointKeys, datastore.DatastoreName);
        }

        return knownEndpointKeys;
    }

    public static void AddGraphNodeEndpointKeys(HashSet<string> endpointKeys, GraphNode node)
    {
        AddEndpointKey(endpointKeys, node.Label);
        AddEndpointKey(endpointKeys, node.NodeId);
        AddEndpointKey(endpointKeys, node.SourceId);
        AddArmResourceIdEndpointKeys(endpointKeys, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
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

        string? syntheticNodeId = BuildSyntheticServiceNodeId(service.ServiceName);

        if (EndpointKeyIsClaimed(service.ServiceName, claimedEndpointKeys)
            || EndpointKeyIsClaimed(service.ServiceId, claimedEndpointKeys)
            || EndpointKeyIsClaimed(syntheticNodeId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, service.ServiceName);
        AddEndpointKey(claimedEndpointKeys, service.ServiceId);
        AddEndpointKey(claimedEndpointKeys, syntheticNodeId);
        AddArmResourceIdEndpointKeys(claimedEndpointKeys, service.ServiceId);

        return true;
    }

    public static bool TryClaimDatastore(ManifestDatastore datastore, HashSet<string> claimedEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(datastore.DatastoreName) && string.IsNullOrWhiteSpace(datastore.DatastoreId))
            return false;

        string? syntheticNodeId = BuildSyntheticDatastoreNodeId(datastore.DatastoreName);

        if (EndpointKeyIsClaimed(datastore.DatastoreName, claimedEndpointKeys)
            || EndpointKeyIsClaimed(datastore.DatastoreId, claimedEndpointKeys)
            || EndpointKeyIsClaimed(syntheticNodeId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, datastore.DatastoreName);
        AddEndpointKey(claimedEndpointKeys, datastore.DatastoreId);
        AddEndpointKey(claimedEndpointKeys, syntheticNodeId);
        AddArmResourceIdEndpointKeys(claimedEndpointKeys, datastore.DatastoreId);

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

    private static void AddArmResourceIdEndpointKeys(HashSet<string> endpointKeys, string? resourceId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(resourceId))
            return;

        AddEndpointKey(endpointKeys, resourceId);
        AddEndpointKey(endpointKeys, GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId!));
    }

    private static void AddSyntheticServiceEndpointKey(HashSet<string> endpointKeys, string? serviceName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticServiceNodeId(serviceName));
    }

    private static void AddSyntheticDatastoreEndpointKey(HashSet<string> endpointKeys, string? datastoreName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticDatastoreNodeId(datastoreName));
    }

    private static string? BuildSyntheticServiceNodeId(string? serviceName) =>
        string.IsNullOrWhiteSpace(serviceName) ? null : $"svc-{serviceName}";

    private static string? BuildSyntheticDatastoreNodeId(string? datastoreName) =>
        string.IsNullOrWhiteSpace(datastoreName) ? null : $"ds-{datastoreName}";

    private static bool EndpointKeyIsClaimed(string? value, HashSet<string> claimedEndpointKeys) =>
        !string.IsNullOrWhiteSpace(value) && claimedEndpointKeys.Contains(value);
}
