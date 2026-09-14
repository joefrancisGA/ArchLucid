using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Fills blank visible connector labels when inventory rows omitted the graph edge type.
///     Executive VNet snapshots still carry VNet-to-VNet peering edges; without this pass those
///     connectors render as unlabeled arrows and the Edges table shows an em dash.
/// </summary>
internal static class DiagramConnectionTypeAnnotator
{
    public static void Annotate(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, DiagramNode> nodesById = ast.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? fromNode)
                || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? toNode))
            {
                continue;
            }

            if (!IsVirtualNetwork(fromNode) || !IsVirtualNetwork(toNode))
            {
                continue;
            }

            if (!ShouldReplaceWithPeering(edge.Label))
            {
                continue;
            }

            edge.Label = "peering";
        }
    }

    private static bool ShouldReplaceWithPeering(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return true;
        }

        string trimmed = label.Trim();

        return string.Equals(trimmed, "connects", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsVirtualNetwork(DiagramNode node)
    {
        return AzureInventoryTopologyCategory.IsVirtualNetworkArmType(node.ArmResourceType ?? string.Empty);
    }
}
