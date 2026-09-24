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

    public sealed record VnetClusterPlan(
        string ClusterId,
        string Label,
        string VnetNodeId,
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

    public static IReadOnlyList<VnetClusterPlan> PlanVnetClusters(
        DiagramAst ast,
        ClusterPlan resourceGroupCluster)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(resourceGroupCluster);

        IReadOnlyDictionary<string, IReadOnlySet<string>> memberships =
            DiagramForestVnetMembership.Resolve(ast.Nodes, ast.Edges, sameResourceGroupOnly: true);
        Dictionary<string, DiagramNode> nodesById = ast.Nodes
            .Where(node => node is not null)
            .ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        HashSet<string> resourceGroupNodeIds = resourceGroupCluster.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        List<VnetClusterPlan> plans = [];

        foreach ((string vnetNodeId, IReadOnlySet<string> memberIds) in memberships)
        {
            if (!nodesById.TryGetValue(vnetNodeId, out DiagramNode? vnet)
                || !resourceGroupNodeIds.Contains(vnetNodeId))
            {
                continue;
            }

            List<DiagramNode> members = memberIds
                .Where(resourceGroupNodeIds.Contains)
                .Where(nodesById.ContainsKey)
                .Select(nodeId => nodesById[nodeId])
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();
            if (members.Count < 2)
            {
                continue;
            }

            plans.Add(new VnetClusterPlan(
                $"vnet_{GraphvizIdEscaper.SanitizeClusterId(vnetNodeId)}",
                vnet.Label,
                vnetNodeId,
                members));
        }

        return plans;
    }
}
