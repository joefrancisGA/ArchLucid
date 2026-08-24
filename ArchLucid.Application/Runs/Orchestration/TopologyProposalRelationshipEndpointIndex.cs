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

        // "ProposedChanges" is a provenance sentinel shared by every topology-agent node, not an architecture endpoint.
        if (!IsAgentProposedSourceSentinel(node.SourceId))
            AddEndpointKey(endpointKeys, node.SourceId);

        AddArmResourceIdEndpointKeys(endpointKeys, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
        AddGraphNodeSyntheticLabelEndpointKeys(endpointKeys, node.Label, node.Category, node.SourceId);
    }

    public static void AddGraphNodeResolutionKeys(Dictionary<string, string> endpointKeyToNodeId, GraphNode node)
    {
        AddResolutionAlias(endpointKeyToNodeId, node.NodeId, node.NodeId);
        AddResolutionAlias(endpointKeyToNodeId, node.Label, node.NodeId);

        if (!IsAgentProposedSourceSentinel(node.SourceId))
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
        AddArmResourceIdResolutionAliases(aliasToNodeId, TrimManifestEndpointValue(service.ServiceId), nodeId);
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
        AddArmResourceIdResolutionAliases(aliasToNodeId, TrimManifestEndpointValue(datastore.DatastoreId), nodeId);
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
        string? nodeId = TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TrimManifestEndpointValue(node.SourceId);
        string? nodeLabel = TrimManifestEndpointValue(node.Label);

        if (serviceId is not null)
        {
            if (string.Equals(nodeId, serviceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(nodeSourceId, serviceId, StringComparison.OrdinalIgnoreCase))
                return true;

            // tf show JSON stamps the Terraform address on Label (declaration id on SourceId); agents often key
            // ServiceId to that address, which the merge gate already indexed via Label.
            if (string.Equals(nodeLabel, serviceId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(serviceId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;

            if (nodeLabel is not null
                && string.Equals(serviceId, BuildSyntheticServiceNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Merge gate indexes both svc- and ds- synthetics for a label; overlays may put ds-{label} on ServiceId.
            if (nodeLabel is not null
                && string.Equals(serviceId, BuildSyntheticDatastoreNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (serviceName is not null)
        {
            if (NodeIdentityMatchesProposedName(node, serviceName))
                return true;

            if (string.Equals(nodeId, BuildSyntheticServiceNodeId(serviceName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool NodeMatchesDatastore(GraphNode node, ManifestDatastore datastore)
    {
        string? datastoreId = TrimManifestEndpointValue(datastore.DatastoreId);
        string? datastoreName = TrimManifestEndpointValue(datastore.DatastoreName);
        string? nodeId = TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TrimManifestEndpointValue(node.SourceId);
        string? nodeLabel = TrimManifestEndpointValue(node.Label);

        if (datastoreId is not null)
        {
            if (string.Equals(nodeId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(nodeSourceId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            // Same tf show JSON shape as services: Terraform address on Label, declaration id on SourceId.
            if (string.Equals(nodeLabel, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (ArmResourceIdMatches(datastoreId, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
                return true;

            if (nodeLabel is not null
                && string.Equals(datastoreId, BuildSyntheticDatastoreNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Symmetric to services: merge gate may accept svc-{label} on DatastoreId for a compute overlay key.
            if (nodeLabel is not null
                && string.Equals(datastoreId, BuildSyntheticServiceNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (datastoreName is not null)
        {
            if (NodeIdentityMatchesProposedName(node, datastoreName))
                return true;

            if (string.Equals(nodeId, BuildSyntheticDatastoreNodeId(datastoreName), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>
    ///     True when <paramref name="proposedName" /> is the inventoried node's label, node id, Terraform source id,
    ///     ARM resource id, or the synthetic <c>svc-|ds-{label}</c> key the merge gate indexes from that label.
    ///     Graph merge must alias the same keys or it drops edges the gate kept.
    /// </summary>
    private static bool NodeIdentityMatchesProposedName(GraphNode node, string proposedName)
    {
        string? nodeLabel = TrimManifestEndpointValue(node.Label);
        string? nodeId = TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TrimManifestEndpointValue(node.SourceId);

        if (string.Equals(nodeLabel, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(nodeId, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(nodeSourceId, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (nodeLabel is not null)
        {
            if (string.Equals(proposedName, BuildSyntheticServiceNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(proposedName, BuildSyntheticDatastoreNodeId(nodeLabel), StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return ArmResourceIdMatches(proposedName, GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
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
        && IsAgentProposedSourceSentinel(node.SourceId);

    private static bool IsAgentProposedSourceSentinel(string? sourceId) =>
        string.Equals(sourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase);

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
            || normalized.Contains("sql_managed_instance", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cosmosdb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("postgresql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mysql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_database", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_server", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("key_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("search_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventhub_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("synapse_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_factory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mariadb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("machine_learning", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("databricks", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kusto_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("app_configuration", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("netapp", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("recovery_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("site_recovery", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("private_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("log_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_insights", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("managed_disk", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("stream_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("iothub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("powerbi", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventgrid", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_enterprise", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("maps_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("digital_twins", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("media_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("elastic_san", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("healthcare_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("managed_lustre", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("video_indexer", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("hpc_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("backup_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mobile_network", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dev_center", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("graph_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("fabric_capacity", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("confidential_ledger", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("pinecone", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mongo_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("elastic_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("neptune_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("oracle_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("oracle_autonomous", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_mover", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_queue", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_table", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_blob", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_container", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_data_lake", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_lake_gen2", StringComparison.OrdinalIgnoreCase);
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
            || normalized.Contains("batch_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("traffic_manager", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azurerm_lb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_frontdoor", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_profile", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azurerm_firewall", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_group", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("express_route", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("automation_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_network_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dns_zone", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("bastion_host", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("nat_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azuread", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("active_directory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_connection", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("monitor_action_group", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("log_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_insights", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("key_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("search_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventhub_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("synapse_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_factory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cosmosdb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mssql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("postgresql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mysql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("communication_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_deployment", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_collection_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_collection_rule", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("web_pubsub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("healthbot", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("notification_hub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("fluid_relay", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("orbital", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_hub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("lab_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("load_test", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dynatrace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_fleet", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_configuration", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("relay_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_center", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dashboard_grafana", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("chaos_studio", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("stack_hci", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("voice_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("workloads_sap", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("palo_alto", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("verifiedaccess", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("workloads_orchestrator", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("extended_location", StringComparison.OrdinalIgnoreCase);
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
