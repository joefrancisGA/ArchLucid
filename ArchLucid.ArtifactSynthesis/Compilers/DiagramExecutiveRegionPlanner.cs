using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Executive snapshots with one VNet per RG flatten into empty swimlanes. When 2+ regions exist,
/// group VNets by region instead so the diagram carries geographic structure.
/// </summary>
internal static class DiagramExecutiveRegionPlanner
{
    public static void ApplyRegionSubgraphs(DiagramAst ast, IReadOnlyList<GraphNode> topologyNodes)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(topologyNodes);

        Dictionary<string, List<DiagramNode>> nodesByRegion = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            GraphNode? sourceNode = topologyNodes.FirstOrDefault(
                candidate => string.Equals(candidate.NodeId, diagramNode.SeedNodeId, StringComparison.Ordinal));

            if (sourceNode is null)
            {
                continue;
            }

            string armType = DiagramAstGraphNodeClassifier.ReadArmType(sourceNode);

            if (!AzureInventoryTopologyCategory.IsVirtualNetworkArmType(armType))
            {
                continue;
            }

            string? region = DiagramAstGraphNodeClassifier.ReadRegion(sourceNode);

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
        int orderKey = 0;

        foreach (KeyValuePair<string, List<DiagramNode>> regionEntry in nodesByRegion
                     .OrderBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase))
        {
            string region = regionEntry.Key;
            string subgraphId = MermaidIdSanitizer.Sanitize($"region-{region}");

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
}
