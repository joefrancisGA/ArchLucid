using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

public sealed class TopologyStructureGap
{
    public required string GapCode
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    public required string Rationale
    {
        get;
        init;
    }

    public required string Description
    {
        get;
        init;
    }

    public required string Impact
    {
        get;
        init;
    }

    public IReadOnlyList<string> RelatedNodeIds
    {
        get;
        init;
    } = [];
}

/// <summary>
///     Deterministic structural topology checks over containment and pillar presence.
/// </summary>
public static class TopologyStructureAnalyzer
{
    public static IReadOnlyList<TopologyStructureGap> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<TopologyStructureGap> gaps = [];
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<string> expectedCategories = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

        if (topologyNodes.Count == 0)
            return gaps;

        List<GraphNode> networkNodes = topologyNodes
            .Where(n => string.Equals(n.Category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
            .ToList();

        List<GraphNode> computeNodes = topologyNodes
            .Where(n => string.Equals(n.Category, GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase))
            .ToList();

        bool expectsNetwork = expectedCategories.Any(c =>
            c.Equals(GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase));

        if (expectsNetwork && computeNodes.Count > 0 && networkNodes.Count == 0)
        {
            gaps.Add(new TopologyStructureGap
            {
                GapCode = "compute-without-network-anchor",
                Title = "Compute resources lack a network anchor",
                Rationale = "Compute topology resources exist but no network category resources are present.",
                Description = "At least one compute resource is declared without any network anchor in the graph.",
                Impact = "Reviewers cannot verify placement, segmentation, or private connectivity for compute workloads.",
                RelatedNodeIds = computeNodes.Select(static n => n.NodeId).ToList()
            });
        }

        if (networkNodes.Count == 0)
            return gaps;

        foreach (GraphNode compute in computeNodes)
        {
            if (IsContainedInNetwork(compute, networkNodes, graphSnapshot))
                continue;

            gaps.Add(new TopologyStructureGap
            {
                GapCode = "compute-not-contained-in-network",
                Title = $"Compute resource '{compute.Label}' is not contained in a network",
                Rationale = "No CONTAINS_RESOURCE edge or parentNodeId links this compute resource to a network node.",
                Description = $"Compute resource '{compute.Label}' is not linked to any network anchor.",
                Impact = "Landing-zone reviewers cannot trace subnet or VNet placement for this compute resource.",
                RelatedNodeIds = [compute.NodeId, .. networkNodes.Select(static n => n.NodeId)]
            });
        }

        return gaps;
    }

    private static bool IsContainedInNetwork(
        GraphNode compute,
        IReadOnlyList<GraphNode> networkNodes,
        GraphSnapshot graphSnapshot)
    {
        if (compute.Properties.TryGetValue("parentNodeId", out string? parentId)
            && networkNodes.Any(n => string.Equals(n.NodeId, parentId, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        HashSet<string> networkIds = networkNodes.Select(static n => n.NodeId).ToHashSet(StringComparer.OrdinalIgnoreCase);

        return graphSnapshot.Edges.Any(edge =>
            string.Equals(edge.EdgeType, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase)
            && networkIds.Contains(edge.FromNodeId)
            && string.Equals(edge.ToNodeId, compute.NodeId, StringComparison.OrdinalIgnoreCase));
    }
}
