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

    public const string RegionNotStoredCaption = "Region was not stored.";

    public const string SingleRegionCaptionTemplate =
        "All located resources in this snapshot are in region {0}. Region swimlanes appear when two or more regions are present.";

    public const string SingleRegionUnlocatedSuffixTemplate =
        "{0} resource(s) had no stored region and are not in region swimlanes.";

    public const string DefaultExecutiveInventoryCaption =
        "This executive inventory diagram shows resources collected in this snapshot. It is not a complete subscription inventory.";

    public static string? BuildSingleRegionCaption(
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyList<DiagramNode> diagramNodes)
    {
        ArgumentNullException.ThrowIfNull(topologyNodes);
        ArgumentNullException.ThrowIfNull(diagramNodes);

        Dictionary<string, GraphNode> sourceNodesById = topologyNodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        HashSet<string> regions = new(StringComparer.OrdinalIgnoreCase);
        int unlocatedCount = 0;

        foreach (DiagramNode diagramNode in diagramNodes)
        {
            string? region = ResolveRegion(diagramNode, sourceNodesById);

            if (string.IsNullOrWhiteSpace(region))
            {
                unlocatedCount++;
                continue;
            }

            regions.Add(region.Trim());
        }

        if (regions.Count != 1)
        {
            return null;
        }

        string caption = string.Format(
            System.Globalization.CultureInfo.InvariantCulture,
            SingleRegionCaptionTemplate,
            regions.First());

        if (unlocatedCount > 0)
        {
            caption = string.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "{0} {1}",
                caption,
                string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    SingleRegionUnlocatedSuffixTemplate,
                    unlocatedCount));
        }

        return caption;
    }

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

        Dictionary<string, GraphNode> sourceNodesByIdForCaptions = sourceNodesById;

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            string? region = ResolveRegion(diagramNode, sourceNodesByIdForCaptions);
            string regionCaption = string.IsNullOrWhiteSpace(region)
                ? RegionNotStoredCaption
                : $"Region {region.Trim()}";
            diagramNode.UnresolvedRelationshipDetails.Add(regionCaption);
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
