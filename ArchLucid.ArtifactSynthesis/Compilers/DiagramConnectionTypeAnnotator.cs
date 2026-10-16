using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Labels blank VNet-to-VNet connectors when no relationship verb was stored. Stored verbs are left unchanged.
/// </summary>
internal static class DiagramConnectionTypeAnnotator
{
    public const string RelationshipNotStoredLabel = "Relationship was not stored";

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

            if (!string.IsNullOrWhiteSpace(edge.Label))
            {
                continue;
            }

            edge.Label = RelationshipNotStoredLabel;
        }
    }

    private static bool IsVirtualNetwork(DiagramNode node)
    {
        return AzureInventoryTopologyCategory.IsVirtualNetworkArmType(node.ArmResourceType ?? string.Empty);
    }
}
