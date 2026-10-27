using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     On Executive diagrams, labels visible VNet↔VNet connectors as <c>peering</c> when the graph
///     omitted edge verbs but the pair is already drawn (owner-shape / row-pack peerings).
/// </summary>
internal static class DiagramExecutiveVnetPeeringOverlayLabelApplier
{
    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, DiagramNode> nodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (!IsVirtualNetworkNode(nodesById, edge.FromNodeId)
                || !IsVirtualNetworkNode(nodesById, edge.ToNodeId))
            {
                continue;
            }

            if (!ShouldOverlayPeeringLabel(edge))
            {
                continue;
            }

            edge.Label = "peering";
            edge.InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering;
            edge.ProvenanceKind = ProvenanceKind.ObservedFact.ToString();
        }
    }

    private static bool ShouldOverlayPeeringLabel(DiagramEdge edge)
    {
        if (string.Equals(edge.Label, "peering", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(
                edge.Label,
                DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel,
                StringComparison.Ordinal))
        {
            return true;
        }

        if (string.Equals(edge.Label, "Provenance was not stored.", StringComparison.Ordinal))
        {
            return true;
        }

        return string.IsNullOrWhiteSpace(edge.Label);
    }

    private static bool IsVirtualNetworkNode(
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        string nodeId)
    {
        if (!nodesById.TryGetValue(nodeId, out DiagramNode? node))
        {
            return false;
        }

        return AzureInventoryTopologyCategory.IsVirtualNetworkArmType(node.ArmResourceType ?? string.Empty);
    }
}
