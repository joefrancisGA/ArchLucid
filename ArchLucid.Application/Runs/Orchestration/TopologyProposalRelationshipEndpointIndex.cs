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
            AddManifestServiceEndpointKeys(knownEndpointKeys, service);
        }

        foreach (ManifestDatastore datastore in datastores)
        {
            AddManifestDatastoreEndpointKeys(knownEndpointKeys, datastore);
        }

        return knownEndpointKeys;
    }

    public static void AddManifestServiceEndpointKeys(HashSet<string> endpointKeys, ManifestService service)
    {
        AddEndpointKey(endpointKeys, service.ServiceName);
        AddEndpointKey(endpointKeys, service.ServiceId);
        AddSyntheticServiceEndpointKey(endpointKeys, service.ServiceName);
    }

    public static void AddManifestDatastoreEndpointKeys(HashSet<string> endpointKeys, ManifestDatastore datastore)
    {
        AddEndpointKey(endpointKeys, datastore.DatastoreName);
        AddEndpointKey(endpointKeys, datastore.DatastoreId);
        AddSyntheticDatastoreEndpointKey(endpointKeys, datastore.DatastoreName);
    }

    public static void AddGraphNodeEndpointKeys(HashSet<string> endpointKeys, GraphNode node)
    {
        AddEndpointKey(endpointKeys, node.Label);
        AddEndpointKey(endpointKeys, node.NodeId);

        // "ProposedChanges" is a provenance sentinel shared by every topology-agent node, not an architecture endpoint.
        if (!TopologyProposalGraphNodeMatchers.IsAgentProposedSourceSentinel(node.SourceId))
            AddEndpointKey(endpointKeys, node.SourceId);

        TopologyProposalEndpointArmKeys.AddArmResourceIdEndpointKeys(
            endpointKeys,
            GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
        TopologyProposalTerraformSourceIdHeuristics.AddGraphNodeSyntheticLabelEndpointKeys(
            endpointKeys,
            node.Label,
            node.Category,
            node.SourceId);
    }

    public static void AddGraphNodeResolutionKeys(Dictionary<string, string> endpointKeyToNodeId, GraphNode node)
    {
        AddResolutionAlias(endpointKeyToNodeId, node.NodeId, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.Label, node.NodeId);

        if (!TopologyProposalGraphNodeMatchers.IsAgentProposedSourceSentinel(node.SourceId))
            AddResolutionAlias(endpointKeyToNodeId, node.SourceId, node.NodeId);

        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            endpointKeyToNodeId,
            GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            node.NodeId);
        TopologyProposalTerraformSourceIdHeuristics.AddGraphNodeSyntheticLabelResolutionAliases(
            endpointKeyToNodeId,
            node.Label,
            node.Category,
            node.SourceId,
            node.NodeId);
    }

    public static void AddManifestServiceEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (!TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, service.ServiceName, nodeId);
        AddResolutionAlias(aliasToNodeId, service.ServiceId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(service.ServiceName), nodeId);
    }

    public static void AddManifestDatastoreEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestDatastore datastore,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (!TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, datastore.DatastoreName, nodeId);
        AddResolutionAlias(aliasToNodeId, datastore.DatastoreId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), nodeId);
    }

    public static void AddDeclaredManifestServiceEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestService service)
    {
        string nodeId = ResolveDeclaredServiceNodeId(service);

        if (string.IsNullOrWhiteSpace(nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, service.ServiceName, nodeId);
        AddResolutionAlias(aliasToNodeId, service.ServiceId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(service.ServiceName), nodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            aliasToNodeId,
            TrimManifestEndpointValue(service.ServiceId),
            nodeId);
    }

    public static void AddDeclaredManifestDatastoreEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestDatastore datastore)
    {
        string nodeId = ResolveDeclaredDatastoreNodeId(datastore);

        if (string.IsNullOrWhiteSpace(nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, datastore.DatastoreName, nodeId);
        AddResolutionAlias(aliasToNodeId, datastore.DatastoreId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), nodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdResolutionAliases(
            aliasToNodeId,
            TrimManifestEndpointValue(datastore.DatastoreId),
            nodeId);
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

    public static bool TryClaimService(ManifestService service, HashSet<string> claimedEndpointKeys) =>
        TryClaimEndpoint(service, claimedEndpointKeys, static s => s.ServiceName, static s => s.ServiceId, BuildSyntheticServiceNodeId);

    public static bool TryClaimDatastore(ManifestDatastore datastore, HashSet<string> claimedEndpointKeys) =>
        TryClaimEndpoint(datastore, claimedEndpointKeys, static d => d.DatastoreName, static d => d.DatastoreId, BuildSyntheticDatastoreNodeId);

    public static bool TryClaim(object endpoint, HashSet<string> claimedEndpointKeys, ITopologyEndpointSource source) =>
        source.TryClaim(endpoint, claimedEndpointKeys);

    private static bool TryClaimEndpoint<T>(
        T endpoint,
        HashSet<string> claimedEndpointKeys,
        Func<T, string?> nameSelector,
        Func<T, string?> idSelector,
        Func<string?, string?> syntheticBuilder)
    {
        string? name = nameSelector(endpoint);
        string? id = idSelector(endpoint);

        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(id))
            return false;

        string? syntheticNodeId = syntheticBuilder(name);

        if (EndpointKeyIsClaimed(name, claimedEndpointKeys)
            || EndpointKeyIsClaimed(id, claimedEndpointKeys)
            || EndpointKeyIsClaimed(syntheticNodeId, claimedEndpointKeys))
        {
            return false;
        }

        AddEndpointKey(claimedEndpointKeys, name);
        AddEndpointKey(claimedEndpointKeys, id);
        AddEndpointKey(claimedEndpointKeys, syntheticNodeId);
        TopologyProposalEndpointArmKeys.AddArmResourceIdEndpointKeys(claimedEndpointKeys, id);

        return true;
    }

    public static bool IsRenameAliasService(ManifestService candidate, IReadOnlyList<ManifestService> acceptedServices)
    {
        string? candidateId = TrimManifestEndpointValue(candidate.ServiceId);
        string? candidateName = TrimManifestEndpointValue(candidate.ServiceName);

        if (candidateId is null || candidateName is null)
            return false;

        foreach (ManifestService accepted in acceptedServices)
        {
            string? acceptedId = TrimManifestEndpointValue(accepted.ServiceId);

            if (!string.Equals(acceptedId, candidateId, StringComparison.OrdinalIgnoreCase))
                continue;

            string? acceptedName = TrimManifestEndpointValue(accepted.ServiceName);

            return !string.Equals(acceptedName, candidateName, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool IsRenameAliasDatastore(ManifestDatastore candidate, IReadOnlyList<ManifestDatastore> acceptedDatastores)
    {
        string? candidateId = TrimManifestEndpointValue(candidate.DatastoreId);
        string? candidateName = TrimManifestEndpointValue(candidate.DatastoreName);

        if (candidateId is null || candidateName is null)
            return false;

        foreach (ManifestDatastore accepted in acceptedDatastores)
        {
            string? acceptedId = TrimManifestEndpointValue(accepted.DatastoreId);

            if (!string.Equals(acceptedId, candidateId, StringComparison.OrdinalIgnoreCase))
                continue;

            string? acceptedName = TrimManifestEndpointValue(accepted.DatastoreName);

            return !string.Equals(acceptedName, candidateName, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool RelationshipEndpointsAreKnown(
        ManifestRelationship relationship,
        HashSet<string> knownEndpointKeys) =>
        EndpointKeyIsKnown(relationship.SourceId, knownEndpointKeys)
        && EndpointKeyIsKnown(relationship.TargetId, knownEndpointKeys);

    public static bool EndpointKeyIsKnown(string? endpointKey, HashSet<string> knownEndpointKeys)
    {
        if (string.IsNullOrWhiteSpace(endpointKey))
            return false;

        string trimmed = endpointKey.Trim();

        if (knownEndpointKeys.Contains(trimmed))
            return true;

        return TopologyProposalEndpointArmKeys.EndpointKeyIsKnownViaArmNormalization(trimmed, knownEndpointKeys);
    }

    public static bool TryResolveGraphTopologyNodeIdForService(
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId) =>
        TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out nodeId);

    public static bool TryResolveGraphTopologyNodeIdForDatastore(
        ManifestDatastore datastore,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId) =>
        TopologyProposalGraphNodeMatchers.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out nodeId);

    internal static string? TrimManifestEndpointValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static void AddEndpointKey(HashSet<string> knownEndpointKeys, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        knownEndpointKeys.Add(value.Trim());
    }

    internal static void AddResolutionAlias(Dictionary<string, string> aliasToNodeId, string? endpointKey, string nodeId)
    {
        if (string.IsNullOrWhiteSpace(endpointKey))
            return;

        aliasToNodeId.TryAdd(endpointKey.Trim(), nodeId);
    }

    internal static void AddSyntheticServiceEndpointKey(HashSet<string> endpointKeys, string? serviceName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticServiceNodeId(serviceName));
    }

    internal static void AddSyntheticDatastoreEndpointKey(HashSet<string> endpointKeys, string? datastoreName)
    {
        AddEndpointKey(endpointKeys, BuildSyntheticDatastoreNodeId(datastoreName));
    }

    internal static string? BuildSyntheticServiceNodeId(string? serviceName) =>
        string.IsNullOrWhiteSpace(serviceName) ? null : $"svc-{serviceName}";

    internal static string? BuildSyntheticDatastoreNodeId(string? datastoreName) =>
        string.IsNullOrWhiteSpace(datastoreName) ? null : $"ds-{datastoreName}";

    private static string ResolveDeclaredServiceNodeId(ManifestService service)
    {
        string? serviceId = TrimManifestEndpointValue(service.ServiceId);

        if (!string.IsNullOrWhiteSpace(serviceId))
            return serviceId;

        string? syntheticNodeId = BuildSyntheticServiceNodeId(TrimManifestEndpointValue(service.ServiceName));

        return syntheticNodeId ?? string.Empty;
    }

    private static string ResolveDeclaredDatastoreNodeId(ManifestDatastore datastore)
    {
        string? datastoreId = TrimManifestEndpointValue(datastore.DatastoreId);

        if (!string.IsNullOrWhiteSpace(datastoreId))
            return datastoreId;

        string? syntheticNodeId = BuildSyntheticDatastoreNodeId(TrimManifestEndpointValue(datastore.DatastoreName));

        return syntheticNodeId ?? string.Empty;
    }

    private static bool EndpointKeyIsClaimed(string? value, HashSet<string> claimedEndpointKeys) =>
        !string.IsNullOrWhiteSpace(value) && claimedEndpointKeys.Contains(value.Trim());
}
