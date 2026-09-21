using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

/// <summary>
/// Plans Graphviz resource-group clusters from Visio-style ArmResourceGroup packing:
/// one cluster per named group on the canvas, including singletons.
/// </summary>
public static class DiagramResourceGroupGraphvizClusterPlanner
{
    public sealed record ClusterPlan(
        string ClusterId,
        string GroupName,
        IReadOnlyList<DiagramNode> Nodes);

    public static IReadOnlyList<ClusterPlan> Plan(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        List<DiagramNode> renderableNodes = ast.Nodes
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells =
            DiagramResourceGroupPacker.PartitionCells(renderableNodes);
        List<ClusterPlan> clusters = [];

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            DiagramResourceGroupPacker.ResourceGroupCell cell = cells[cellIndex];

            if (cell is null || !DiagramResourceGroupPacker.ShouldDrawFrame(cell))
            {
                continue;
            }

            clusters.Add(new ClusterPlan(
                DiagramResourceGroupPacker.BuildFrameCellId("rg", cellIndex),
                cell.GroupName!,
                cell.Nodes));
        }

        return clusters;
    }

    public static HashSet<string> ResolveClusteredNodeIds(IReadOnlyList<ClusterPlan> clusters)
    {
        ArgumentNullException.ThrowIfNull(clusters);

        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        foreach (ClusterPlan cluster in clusters)
        {
            if (cluster.Nodes is null)
            {
                continue;
            }

            foreach (DiagramNode node in cluster.Nodes)
            {
                if (node is null || string.IsNullOrWhiteSpace(node.NodeId))
                {
                    continue;
                }

                nodeIds.Add(node.NodeId);
            }
        }

        return nodeIds;
    }
}
