using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
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
        AddGraphNodeSyntheticLabelEndpointKeys(endpointKeys, node.Label, node.Category);
    }

    public static void AddGraphNodeResolutionKeys(Dictionary<string, string> endpointKeyToNodeId, GraphNode node)
    {
        AddResolutionAlias(endpointKeyToNodeId, node.NodeId, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.Label, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.SourceId, node.NodeId);
        AddArmResourceIdResolutionAliases(endpointKeyToNodeId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node), node.NodeId);
        AddGraphNodeSyntheticLabelResolutionAliases(endpointKeyToNodeId, node.Label, node.Category, node.NodeId);
    }

    public static void AddManifestServiceEndpointAliases(
        Dictionary<string, string> aliasToNodeId,
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (!TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId))
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
        if (!TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId))
            return;

        AddResolutionAlias(aliasToNodeId, datastore.DatastoreName, nodeId);
        AddResolutionAlias(aliasToNodeId, datastore.DatastoreId, nodeId);
        AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), nodeId);
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

    public static bool TryResolveGraphTopologyNodeIdForService(
        ManifestService service,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId)
    {
        foreach (GraphNode node in graphNodes)
        {
            if (!IsGraphTopologyResource(node))
                continue;

            if (!NodeMatchesService(node, service))
                continue;

            nodeId = node.NodeId;
            return true;
        }

        nodeId = string.Empty;
        return false;
    }

    public static bool TryResolveGraphTopologyNodeIdForDatastore(
        ManifestDatastore datastore,
        IReadOnlyList<GraphNode> graphNodes,
        out string nodeId)
    {
        foreach (GraphNode node in graphNodes)
        {
            if (!IsGraphTopologyResource(node))
                continue;

            if (!NodeMatchesDatastore(node, datastore))
                continue;

            nodeId = node.NodeId;
            return true;
        }

        nodeId = string.Empty;
        return false;
    }

    private static bool NodeMatchesService(GraphNode node, ManifestService service)
    {
        if (!string.IsNullOrWhiteSpace(service.ServiceId))
        {
            if (string.Equals(node.NodeId, service.ServiceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.SourceId, service.ServiceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(service.ServiceId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;
        }

        if (!string.IsNullOrWhiteSpace(service.ServiceName))
        {
            if (string.Equals(node.Label, service.ServiceName, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.NodeId, BuildSyntheticServiceNodeId(service.ServiceName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool NodeMatchesDatastore(GraphNode node, ManifestDatastore datastore)
    {
        if (!string.IsNullOrWhiteSpace(datastore.DatastoreId))
        {
            if (string.Equals(node.NodeId, datastore.DatastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.SourceId, datastore.DatastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(datastore.DatastoreId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;
        }

        if (!string.IsNullOrWhiteSpace(datastore.DatastoreName))
        {
            if (string.Equals(node.Label, datastore.DatastoreName, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.NodeId, BuildSyntheticDatastoreNodeId(datastore.DatastoreName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool ArmResourceIdMatches(string candidate, string? nodeResourceId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(candidate)
            || !GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(nodeResourceId))
        {
            return false;
        }

        return string.Equals(
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(candidate),
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(nodeResourceId!),
            StringComparison.Ordinal);
    }

    private static bool IsGraphTopologyResource(GraphNode node) =>
        string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase);

    private static bool IsInventoriedTopologyResource(GraphNode node) =>
        IsGraphTopologyResource(node)
        && !IsAgentProposedTopologyNode(node);

    private static bool IsAgentProposedTopologyNode(GraphNode node) =>
        string.Equals(node.SourceType, nameof(AgentType.Topology), StringComparison.OrdinalIgnoreCase)
        && string.Equals(node.SourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase);

    private static void AddEndpointKey(HashSet<string> knownEndpointKeys, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            knownEndpointKeys.Add(value);
    }

    private static void AddResolutionAlias(Dictionary<string, string> aliasToNodeId, string? endpointKey, string nodeId)
    {
        if (!string.IsNullOrWhiteSpace(endpointKey))
            aliasToNodeId.TryAdd(endpointKey, nodeId);
    }

    private static void AddArmResourceIdEndpointKeys(HashSet<string> endpointKeys, string? resourceId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(resourceId))
            return;

        AddEndpointKey(endpointKeys, resourceId);
        AddEndpointKey(endpointKeys, GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId!));
    }

    private static void AddArmResourceIdResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? resourceId,
        string nodeId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(resourceId))
            return;

        AddResolutionAlias(aliasToNodeId, resourceId, nodeId);
        AddResolutionAlias(aliasToNodeId, GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId!), nodeId);
    }

    private static void AddGraphNodeSyntheticLabelEndpointKeys(HashSet<string> endpointKeys, string? label, string? category)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            AddSyntheticDatastoreEndpointKey(endpointKeys, label);
            return;
        }

        AddSyntheticServiceEndpointKey(endpointKeys, label);
    }

    private static void AddGraphNodeSyntheticLabelResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? label,
        string? category,
        string nodeId)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(label), nodeId);
            return;
        }

        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(label), nodeId);
    }

    private static bool IsDatastoreCategory(string? category) =>
        string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
        || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);

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
