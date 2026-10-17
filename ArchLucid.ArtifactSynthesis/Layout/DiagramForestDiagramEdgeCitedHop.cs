using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Diagram-edge cited-hop checks used by forest layout (IDX-03 / IDX-08).</summary>
internal static class DiagramForestDiagramEdgeCitedHop
{
    public static bool IsCitedHop(DiagramEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (edge.IsLayoutOnly)
        {
            return false;
        }

        string source = edge.InferenceSource ?? string.Empty;

        if (string.Equals(source, GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (DiagramForestVnetMembership.IsCitedPlacementEdge(edge))
        {
            return true;
        }

        if (DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge)
            || string.Equals(edge.Label, GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryVnetPeering, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPropertyArmId, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(edge.Label, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}
