using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class HeuristicNetworkSubnetEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightHeuristicTopologyContainment = 0.5d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        List<GraphNode> networks = context.TopologyNodes
            .Where(x => string.Equals(x.Category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
            .ToList();

        List<GraphNode> subnets = context.TopologyNodes
            .Where(x => x.Label.Contains("subnet", StringComparison.OrdinalIgnoreCase))
            .ToList();

        int networkCount = networks.Count;

        foreach (GraphNode network in networks)
        foreach (GraphNode subnet in subnets)
        {
            if (!ShouldInferNetworkContainsSubnet(network, subnet, networkCount))
                continue;

            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                network.NodeId,
                subnet.NodeId,
                GraphEdgeTypes.ContainsResource,
                "contains resource",
                WeightHeuristicTopologyContainment,
                GraphEdgeInferenceSources.HeuristicNetworkSubnet));
        }
    }

    private static bool ShouldInferNetworkContainsSubnet(GraphNode network, GraphNode subnet, int networkCount)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(subnet.Properties, "parentNodeId", out string? parentId)
            && string.Equals(parentId, network.NodeId, StringComparison.OrdinalIgnoreCase))
            return true;

        if (networkCount == 1)
            return true;

        string netLabel = network.Label;
        if (string.IsNullOrWhiteSpace(netLabel) || netLabel.Length < 3)
            return false;

        return subnet.Label.Contains(netLabel, StringComparison.OrdinalIgnoreCase);
    }
}
