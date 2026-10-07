using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Makes omitted VNet-to-VNet relationship labels explicit without inferring a relationship type.
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

            edge.Label = "Relationship was not stored";
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
