using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

internal static class TopologyProposalGraphNodeMatchers
{
    internal static bool TryResolveGraphTopologyNodeIdForService(
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

    internal static bool TryResolveGraphTopologyNodeIdForDatastore(
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

    internal static bool NodeMatchesService(GraphNode node, ManifestService service)
    {
        string? serviceId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(service.ServiceId);
        string? serviceName = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(service.ServiceName);
        string? nodeId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.SourceId);
        string? nodeLabel = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.Label);

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

            if (TopologyProposalEndpointArmKeys.ArmResourceIdMatches(
                    serviceId,
                    GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
            {
                return true;
            }

            if (nodeLabel is not null
                && string.Equals(
                    serviceId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Merge gate indexes both svc- and ds- synthetics for a label; overlays may put ds-{label} on ServiceId.
            if (nodeLabel is not null
                && string.Equals(
                    serviceId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (serviceName is not null)
        {
            if (NodeIdentityMatchesProposedName(node, serviceName))
                return true;

            if (string.Equals(
                    nodeId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(serviceName),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    internal static bool NodeMatchesDatastore(GraphNode node, ManifestDatastore datastore)
    {
        string? datastoreId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(datastore.DatastoreId);
        string? datastoreName = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(datastore.DatastoreName);
        string? nodeId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.SourceId);
        string? nodeLabel = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.Label);

        if (datastoreId is not null)
        {
            if (string.Equals(nodeId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(nodeSourceId, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            // Same tf show JSON shape as services: Terraform address on Label, declaration id on SourceId.
            if (string.Equals(nodeLabel, datastoreId, StringComparison.OrdinalIgnoreCase))
                return true;

            if (TopologyProposalEndpointArmKeys.ArmResourceIdMatches(
                    datastoreId,
                    GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node)))
            {
                return true;
            }

            if (nodeLabel is not null
                && string.Equals(
                    datastoreId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Symmetric to services: merge gate may accept svc-{label} on DatastoreId for a compute overlay key.
            if (nodeLabel is not null
                && string.Equals(
                    datastoreId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (datastoreName is not null)
        {
            if (NodeIdentityMatchesProposedName(node, datastoreName))
                return true;

            if (string.Equals(
                    nodeId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(datastoreName),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    ///     True when <paramref name="proposedName" /> is the inventoried node's label, node id, Terraform source id,
    ///     ARM resource id, or the synthetic <c>svc-|ds-{label}</c> key the merge gate indexes from that label.
    ///     Graph merge must alias the same keys or it drops edges the gate kept.
    /// </summary>
    internal static bool NodeIdentityMatchesProposedName(GraphNode node, string proposedName)
    {
        string? nodeLabel = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.Label);
        string? nodeId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.NodeId);
        string? nodeSourceId = TopologyProposalRelationshipEndpointIndex.TrimManifestEndpointValue(node.SourceId);

        if (string.Equals(nodeLabel, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(nodeId, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(nodeSourceId, proposedName, StringComparison.OrdinalIgnoreCase))
            return true;

        if (nodeLabel is not null)
        {
            if (string.Equals(
                    proposedName,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.Equals(
                    proposedName,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(nodeLabel),
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return TopologyProposalEndpointArmKeys.ArmResourceIdMatches(
            proposedName,
            GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node));
    }

    internal static bool IsGraphTopologyResource(GraphNode node) =>
        string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase);

    internal static bool IsInventoriedTopologyResource(GraphNode node) =>
        IsGraphTopologyResource(node)
        && !IsAgentProposedTopologyNode(node);

    internal static bool IsAgentProposedTopologyNode(GraphNode node) =>
        string.Equals(node.SourceType, nameof(AgentType.Topology), StringComparison.OrdinalIgnoreCase)
        && IsAgentProposedSourceSentinel(node.SourceId);

    internal static bool IsAgentProposedSourceSentinel(string? sourceId) =>
        string.Equals(sourceId, "ProposedChanges", StringComparison.OrdinalIgnoreCase);
}
