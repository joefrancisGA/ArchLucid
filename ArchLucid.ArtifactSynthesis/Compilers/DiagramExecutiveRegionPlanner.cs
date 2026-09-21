using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Executive snapshots with one resource per RG flatten into empty swimlanes. When 2+ regions exist,
/// group every located node (VNets and always-show tiers) by region instead so the diagram carries
/// geographic structure. Nodes without a region (rollup nodes) sit at the top level.
/// </summary>
internal static class DiagramExecutiveRegionPlanner
{
    private const string RegionSubgraphIdPrefix = "region-";

    public static void ApplyRegionSubgraphs(DiagramAst ast, IReadOnlyList<GraphNode> topologyNodes)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(topologyNodes);

        Dictionary<string, GraphNode> sourceNodesById = topologyNodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, List<DiagramNode>> nodesByRegion = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            string? region = ResolveRegion(diagramNode, sourceNodesById);

            if (string.IsNullOrWhiteSpace(region))
            {
                continue;
            }

            if (!nodesByRegion.TryGetValue(region, out List<DiagramNode>? regionNodes))
            {
                regionNodes = [];
                nodesByRegion[region] = regionNodes;
            }

            regionNodes.Add(diagramNode);
        }

        if (nodesByRegion.Count < 2)
        {
            return;
        }

        ast.Subgraphs.Clear();

        // RG frames are gone, so every node must either land in a region frame or float at the top level.
        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            diagramNode.SubgraphId = null;
        }

        int orderKey = 0;

        foreach (KeyValuePair<string, List<DiagramNode>> regionEntry in nodesByRegion
                     .OrderBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase))
        {
            string region = regionEntry.Key;
            string subgraphId = MermaidIdSanitizer.Sanitize($"{RegionSubgraphIdPrefix}{region}");

            ast.Subgraphs.Add(new DiagramSubgraph
            {
                SubgraphId = subgraphId,
                Label = $"Region {region}",
                ParentSubgraphId = null,
                OrderKey = orderKey++,
            });

            foreach (DiagramNode diagramNode in regionEntry.Value)
            {
                diagramNode.SubgraphId = subgraphId;
            }
        }
    }

    private static string? ResolveRegion(DiagramNode diagramNode, IReadOnlyDictionary<string, GraphNode> sourceNodesById)
    {
        if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
            || !sourceNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? sourceNode))
        {
            return null;
        }

        return DiagramAstGraphNodeClassifier.ReadRegion(sourceNode);
    }
}
