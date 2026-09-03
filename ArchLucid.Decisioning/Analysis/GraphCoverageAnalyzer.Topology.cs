using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

partial class GraphCoverageAnalyzer
{
    public TopologyCoverageResult AnalyzeTopology(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);

        List<string> categories = topologyNodes
            .Select(x => x.Category ?? "general")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        IReadOnlyList<string> expectedCategories = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

        TopologyCoverageResult result = new()
        {
            HasNetwork =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase)),
            HasCompute =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase)),
            HasStorage =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)),
            HasData =
                categories.Exists(x => x.Equals(GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)),
            PresentCategories = categories,
            ExpectedCategories = [.. expectedCategories],
            TopologyNodeCount = topologyNodes.Count,
            TopologyNodeIds = topologyNodes.Select(n => n.NodeId).ToList()
        };

        foreach (string expected in expectedCategories)
        {
            if (categories.Exists(c => c.Equals(expected, StringComparison.OrdinalIgnoreCase)))
                continue;

            result.MissingCategories.Add(expected);
        }

        return result;
    }
}
