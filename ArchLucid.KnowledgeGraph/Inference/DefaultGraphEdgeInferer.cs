using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference;

public class DefaultGraphEdgeInferer : IGraphEdgeInferer
{
    private const double WeightContextContains = 0.55d;
    private const double WeightExplicitParentChild = 1d;
    private const double WeightHeuristicTopologyContainment = 0.5d;
    private const double WeightPolicyTargeted = 1d;
    private const double WeightPolicySingleTopology = 0.55d;
    private const double WeightRequirementTargeted = 1d;
    private const double WeightRequirementSingleTopology = 0.55d;
    private const double WeightSecurityTargeted = 1d;
    private const double WeightSecuritySingleTopology = 0.55d;
    private const double WeightTopologyRelationship = 1d;

    public IReadOnlyList<GraphEdge> InferEdges(
        ContextSnapshot contextSnapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];

        string contextNodeId = $"context-{contextSnapshot.SnapshotId:N}";
        List<GraphNode> topologyNodes = nodes.Where(x => x.NodeType == GraphNodeTypes.TopologyResource).ToList();
        List<GraphNode> securityNodes = nodes.Where(x => x.NodeType == GraphNodeTypes.SecurityBaseline).ToList();
        List<GraphNode> policyNodes = nodes.Where(x => x.NodeType == GraphNodeTypes.PolicyControl).ToList();
        List<GraphNode> requirementNodes = nodes.Where(x => x.NodeType == GraphNodeTypes.Requirement).ToList();

        edges.AddRange(nodes.Where(x => x.NodeType != GraphNodeTypes.ContextSnapshot).Select(node =>
            CreateEdge(
                contextNodeId,
                node.NodeId,
                GraphEdgeTypes.Contains,
                "contains",
                WeightContextContains,
                GraphEdgeInferenceSources.ContextMembership)));

        Dictionary<string, GraphNode> nodeById = nodes.ToDictionary(n => n.NodeId, StringComparer.OrdinalIgnoreCase);

        InferExplicitParentChildContainment(edges, nodes, nodeById);
        InferTopologyContainment(edges, topologyNodes);
        InferTopologyRelationships(edges, topologyNodes);
        InferSecurityProtection(edges, securityNodes, topologyNodes);
        InferPolicyApplicability(edges, policyNodes, topologyNodes);
        InferRequirementRelevance(edges, requirementNodes, topologyNodes);

        return Deduplicate(edges);
    }

    private static void InferExplicitParentChildContainment(
        List<GraphEdge> edges,
        IReadOnlyList<GraphNode> nodes,
        Dictionary<string, GraphNode> nodeById)
    {
        foreach (GraphNode node in nodes)
        {
            if (!node.Properties.TryGetValue("parentNodeId", out string? parentId))
                continue;

            if (string.IsNullOrWhiteSpace(parentId))
                continue;

            if (!nodeById.ContainsKey(parentId))
                continue;

            edges.Add(CreateEdge(
                parentId,
                node.NodeId,
                GraphEdgeTypes.ContainsResource,
                "contains resource",
                WeightExplicitParentChild,
                GraphEdgeInferenceSources.ExplicitParentChild));
        }
    }

    private static void InferTopologyContainment(
        List<GraphEdge> edges,
        List<GraphNode> topologyNodes)
    {
        List<GraphNode> networks = topologyNodes
            .Where(x => string.Equals(x.Category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
            .ToList();

        List<GraphNode> subnets = topologyNodes
            .Where(x => x.Label.Contains("subnet", StringComparison.OrdinalIgnoreCase))
            .ToList();

        int networkCount = networks.Count;

        foreach (GraphNode network in networks)

        foreach (GraphNode subnet in subnets)
        {
            if (!ShouldInferNetworkContainsSubnet(network, subnet, networkCount))
                continue;

            edges.Add(CreateEdge(
                network.NodeId,
                subnet.NodeId,
                GraphEdgeTypes.ContainsResource,
                "contains resource",
                WeightHeuristicTopologyContainment,
                GraphEdgeInferenceSources.HeuristicNetworkSubnet));
        }
    }

    /// <summary>
    ///     Avoids full VNet × subnet cross-joins when multiple network anchors exist: link only when parent id matches,
    ///     the graph has a single network, or the subnet label appears to name the VNet.
    /// </summary>
    private static bool ShouldInferNetworkContainsSubnet(GraphNode network, GraphNode subnet, int networkCount)
    {
        if (subnet.Properties.TryGetValue("parentNodeId", out string? parentId)
            && string.Equals(parentId, network.NodeId, StringComparison.OrdinalIgnoreCase))
            return true;

        if (networkCount == 1)
            return true;

        string netLabel = network.Label;
        if (string.IsNullOrWhiteSpace(netLabel) || netLabel.Length < 3)
            return false;

        return subnet.Label.Contains(netLabel, StringComparison.OrdinalIgnoreCase);
    }

    private static void InferTopologyRelationships(
        List<GraphEdge> edges,
        List<GraphNode> topologyNodes)
    {
        Dictionary<string, GraphNode> topologyById = topologyNodes.ToDictionary(n => n.NodeId, StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            AddTargetedEdges(
                edges,
                node,
                CanonicalGraphPropertyKeys.DependsOnNodeIds,
                GraphEdgeTypes.DependsOn,
                "depends on",
                GraphEdgeInferenceSources.TopologyDependsOn,
                topologyById);

            AddTargetedEdges(
                edges,
                node,
                CanonicalGraphPropertyKeys.ExposesToNodeIds,
                GraphEdgeTypes.Exposes,
                "exposes",
                GraphEdgeInferenceSources.TopologyExposes,
                topologyById);

            if (node.Properties.TryGetValue("connectedToNodeIds", out string? connectedRaw)
                && !string.IsNullOrWhiteSpace(connectedRaw))
            {
                foreach (string targetId in connectedRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (!topologyById.ContainsKey(targetId))
                        continue;

                    edges.Add(CreateEdge(
                        node.NodeId,
                        targetId,
                        GraphEdgeTypes.ConnectsTo,
                        "connects to",
                        WeightTopologyRelationship,
                        GraphEdgeInferenceSources.TopologyConnectsTo));
                }
            }
        }
    }

    private static void AddTargetedEdges(
        List<GraphEdge> edges,
        GraphNode fromNode,
        string propertyKey,
        string edgeType,
        string label,
        string inferenceSource,
        Dictionary<string, GraphNode> topologyById)
    {
        HashSet<string>? targeted = ParseTargetNodeIds(fromNode.Properties, propertyKey);

        if (targeted is null || targeted.Count == 0)
            return;

        foreach (string targetId in targeted)
        {
            if (!topologyById.ContainsKey(targetId))
                continue;

            edges.Add(CreateEdge(
                fromNode.NodeId,
                targetId,
                edgeType,
                label,
                WeightTopologyRelationship,
                inferenceSource));
        }
    }

    private static void InferSecurityProtection(
        List<GraphEdge> edges,
        List<GraphNode> securityNodes,
        List<GraphNode> topologyNodes)
    {
        foreach (GraphNode security in securityNodes)
        {
            HashSet<string>? targeted =
                ParseTargetNodeIds(security.Properties, CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in topologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(CreateEdge(
                        security.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.Protects,
                        "protects",
                        WeightSecurityTargeted,
                        GraphEdgeInferenceSources.SecurityTargeted));
                }

                continue;
            }

            if (topologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = topologyNodes[0];
            edges.Add(CreateEdge(
                security.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.Protects,
                "protects",
                WeightSecuritySingleTopology,
                GraphEdgeInferenceSources.SecuritySingleTopologyFallback));
        }
    }

    private static void InferPolicyApplicability(
        List<GraphEdge> edges,
        List<GraphNode> policyNodes,
        List<GraphNode> topologyNodes)
    {
        foreach (GraphNode policy in policyNodes)
        {
            HashSet<string>? targeted =
                ParseTargetNodeIds(policy.Properties, CanonicalGraphPropertyKeys.ApplicableTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in topologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(CreateEdge(
                        policy.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.AppliesTo,
                        "applies to",
                        WeightPolicyTargeted,
                        GraphEdgeInferenceSources.PolicyTargeted));
                }

                continue;
            }

            if (topologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = topologyNodes[0];
            edges.Add(CreateEdge(
                policy.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.AppliesTo,
                "applies to",
                WeightPolicySingleTopology,
                GraphEdgeInferenceSources.PolicySingleTopologyFallback));
        }
    }

    private static void InferRequirementRelevance(
        List<GraphEdge> edges,
        List<GraphNode> requirementNodes,
        List<GraphNode> topologyNodes)
    {
        foreach (GraphNode requirement in requirementNodes)
        {
            HashSet<string>? targeted = ParseTargetNodeIds(requirement.Properties,
                CanonicalGraphPropertyKeys.RelatedTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in topologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(CreateEdge(
                        requirement.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.RelatesTo,
                        "relates to",
                        WeightRequirementTargeted,
                        GraphEdgeInferenceSources.RequirementTargeted));
                }

                continue;
            }

            if (topologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = topologyNodes[0];
            edges.Add(CreateEdge(
                requirement.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.RelatesTo,
                "relates to",
                WeightRequirementSingleTopology,
                GraphEdgeInferenceSources.RequirementSingleTopologyFallback));
        }
    }

    /// <summary>
    ///     Parses comma-separated node ids; returns <see langword="null" /> when the key is missing or empty.
    /// </summary>
    private static HashSet<string>? ParseTargetNodeIds(Dictionary<string, string> properties, string key)
    {
        if (!properties.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return null;

        string[] parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length == 0 ? null : parts.ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static GraphEdge CreateEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string label,
        double weight,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = Guid.NewGuid().ToString("N"),
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = label,
            Weight = weight,
            InferenceSource = inferenceSource,
            ReasoningTrace = GraphEdgeInferenceReasoningSummaries.ForRule(inferenceSource)
        };
    }

    private static List<GraphEdge> Deduplicate(List<GraphEdge> edges)
    {
        return edges
            .GroupBy(
                x => $"{x.FromNodeId}|{x.ToNodeId}|{x.EdgeType}",
                StringComparer.OrdinalIgnoreCase)
            .Select(g => g.OrderByDescending(e => e.Weight).First())
            .ToList();
    }
}
