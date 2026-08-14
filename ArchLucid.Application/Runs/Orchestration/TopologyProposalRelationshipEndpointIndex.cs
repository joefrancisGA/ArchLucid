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
        AddEndpointKey(endpointKeys, node.SourceId);
        AddArmResourceIdEndpointKeys(endpointKeys, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
        AddGraphNodeSyntheticLabelEndpointKeys(endpointKeys, node.Label, node.Category, node.SourceId);
    }

    public static void AddGraphNodeResolutionKeys(Dictionary<string, string> endpointKeyToNodeId, GraphNode node)
    {
        AddResolutionAlias(endpointKeyToNodeId, node.NodeId, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.Label, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.SourceId, node.NodeId);
        AddArmResourceIdResolutionAliases(endpointKeyToNodeId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node), node.NodeId);
        AddGraphNodeSyntheticLabelResolutionAliases(endpointKeyToNodeId, node.Label, node.Category, node.SourceId, node.NodeId);
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

    public static bool IsRenameAliasService(ManifestService candidate, IReadOnlyList<ManifestService> acceptedServices)
    {
        if (string.IsNullOrWhiteSpace(candidate.ServiceId) || string.IsNullOrWhiteSpace(candidate.ServiceName))
            return false;

        foreach (ManifestService accepted in acceptedServices)
        {
            if (!string.Equals(accepted.ServiceId, candidate.ServiceId, StringComparison.OrdinalIgnoreCase))
                continue;

            return !string.Equals(accepted.ServiceName, candidate.ServiceName, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    public static bool IsRenameAliasDatastore(ManifestDatastore candidate, IReadOnlyList<ManifestDatastore> acceptedDatastores)
    {
        if (string.IsNullOrWhiteSpace(candidate.DatastoreId) || string.IsNullOrWhiteSpace(candidate.DatastoreName))
            return false;

        foreach (ManifestDatastore accepted in acceptedDatastores)
        {
            if (!string.Equals(accepted.DatastoreId, candidate.DatastoreId, StringComparison.OrdinalIgnoreCase))
                continue;

            return !string.Equals(accepted.DatastoreName, candidate.DatastoreName, StringComparison.OrdinalIgnoreCase);
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

        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmed))
            return false;

        return knownEndpointKeys.Contains(
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmed));
    }

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
        string? serviceId = TrimManifestEndpointValue(service.ServiceId);
        string? serviceName = TrimManifestEndpointValue(service.ServiceName);

        if (serviceId is not null)
        {
            if (string.Equals(node.NodeId, serviceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.SourceId, serviceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(serviceId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;

            if (!string.IsNullOrWhiteSpace(node.Label)
                && string.Equals(serviceId, BuildSyntheticServiceNodeId(node.Label), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (serviceName is not null)
        {
            if (string.Equals(node.Label, serviceName, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.NodeId, BuildSyntheticServiceNodeId(serviceName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool NodeMatchesDatastore(GraphNode node, ManifestDatastore datastore)
    {
        string? datastoreId = TrimManifestEndpointValue(datastore.DatastoreId);
        string? datastoreName = TrimManifestEndpointValue(datastore.DatastoreName);

        if (datastoreId is not null)
        {
            if (string.Equals(node.NodeId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.SourceId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(datastoreId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;

            if (!string.IsNullOrWhiteSpace(node.Label)
                && string.Equals(datastoreId, BuildSyntheticDatastoreNodeId(node.Label), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (datastoreName is not null)
        {
            if (string.Equals(node.Label, datastoreName, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(node.NodeId, BuildSyntheticDatastoreNodeId(datastoreName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string? TrimManifestEndpointValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

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
        if (string.IsNullOrWhiteSpace(value))
            return;

        knownEndpointKeys.Add(value.Trim());
    }

    private static void AddResolutionAlias(Dictionary<string, string> aliasToNodeId, string? endpointKey, string nodeId)
    {
        if (string.IsNullOrWhiteSpace(endpointKey))
            return;

        aliasToNodeId.TryAdd(endpointKey.Trim(), nodeId);
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

    private static void AddGraphNodeSyntheticLabelEndpointKeys(
        HashSet<string> endpointKeys,
        string? label,
        string? category,
        string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            AddSyntheticDatastoreEndpointKey(endpointKeys, label);

            if (LooksLikeTerraformServiceSourceId(sourceId))
                AddSyntheticServiceEndpointKey(endpointKeys, label);

            return;
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            // Inventoried nodes may omit category; accept both synthetic service and datastore aliases.
            AddSyntheticServiceEndpointKey(endpointKeys, label);
            AddSyntheticDatastoreEndpointKey(endpointKeys, label);
            return;
        }

        AddSyntheticServiceEndpointKey(endpointKeys, label);

        if (LooksLikeTerraformDatastoreSourceId(sourceId))
            AddSyntheticDatastoreEndpointKey(endpointKeys, label);
    }

    private static void AddGraphNodeSyntheticLabelResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? label,
        string? category,
        string? sourceId,
        string nodeId)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(label), nodeId);

            if (LooksLikeTerraformServiceSourceId(sourceId))
                AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(label), nodeId);

            return;
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(label), nodeId);
            AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(label), nodeId);
            return;
        }

        AddResolutionAlias(aliasToNodeId, BuildSyntheticServiceNodeId(label), nodeId);

        if (LooksLikeTerraformDatastoreSourceId(sourceId))
            AddResolutionAlias(aliasToNodeId, BuildSyntheticDatastoreNodeId(label), nodeId);
    }

    private static bool LooksLikeTerraformDatastoreSourceId(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return false;

        string normalized = sourceId.Trim();

        return normalized.Contains("mssql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cosmosdb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("postgresql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mysql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_database", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("key_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("search_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventhub_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("synapse_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_factory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mariadb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("machine_learning", StringComparison.OrdinalIgnoreCase);
    }

    private static bool LooksLikeTerraformServiceSourceId(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return false;

        string normalized = sourceId.Trim();

        return normalized.Contains("app_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_management", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("function_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("linux_web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("windows_web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("static_site", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("signalr_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("logic_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("service_plan", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("spring_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("servicebus_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_registry", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("service_fabric", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_machine", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("batch_account", StringComparison.OrdinalIgnoreCase);
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
        !string.IsNullOrWhiteSpace(value) && claimedEndpointKeys.Contains(value.Trim());
}
