using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

/// <summary>Plans Graphviz resource-group clusters from ArmResourceGroup packing (IDF-06).</summary>
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

        List<List<DiagramNode>> components = DiagramComponentBuilder.BuildConnectedComponents(
            renderableNodes,
            ast.Edges);
        List<ClusterPlan> clusters = [];

        for (int componentIndex = 0; componentIndex < components.Count; componentIndex++)
        {
            List<DiagramNode> component = components[componentIndex];
            IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells =
                DiagramResourceGroupPacker.PartitionCells(component);

            for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
            {
                DiagramResourceGroupPacker.ResourceGroupCell cell = cells[cellIndex];

                if (!DiagramResourceGroupPacker.ShouldDrawFrame(cell))
                {
                    continue;
                }

                clusters.Add(new ClusterPlan(
                    DiagramResourceGroupPacker.BuildFrameCellId(componentIndex.ToString(), cellIndex),
                    cell.GroupName!,
                    cell.Nodes));
            }
        }

        return clusters;
    }

    public static HashSet<string> ResolveClusteredNodeIds(IReadOnlyList<ClusterPlan> clusters)
    {
        ArgumentNullException.ThrowIfNull(clusters);

        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        foreach (ClusterPlan cluster in clusters)
        {
            foreach (DiagramNode node in cluster.Nodes)
            {
                nodeIds.Add(node.NodeId);
            }
        }

        return nodeIds;
    }
}
