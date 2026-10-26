using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels Recovery Services replication edges with stored target region honesty.</summary>
internal static class InventoryDiagramRecoveryServicesRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        Dictionary<(string From, string To), GraphEdge> graphEdgesByDiagramEndpoints = new();

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (!graphToDiagramNodeId.TryGetValue(graphEdge.FromNodeId, out string? fromDiagramId)
                || !graphToDiagramNodeId.TryGetValue(graphEdge.ToNodeId, out string? toDiagramId))
            {
                continue;
            }

            graphEdgesByDiagramEndpoints[(fromDiagramId, toDiagramId)] = graphEdge;
        }

        foreach (DiagramEdge diagramEdge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    diagramEdge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphEdgesByDiagramEndpoints.TryGetValue(
                    (diagramEdge.FromNodeId, diagramEdge.ToNodeId),
                    out GraphEdge? graphEdge))
            {
                diagramEdge.Label = InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesReplicatesLabel(null);

                continue;
            }

            string? targetRegion = null;

            if (graphEdge.Properties.TryGetValue(
                    AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey,
                    out string? storedRegion))
            {
                targetRegion = storedRegion;
            }

            diagramEdge.Label = InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesReplicatesLabel(targetRegion);
        }
    }
}
