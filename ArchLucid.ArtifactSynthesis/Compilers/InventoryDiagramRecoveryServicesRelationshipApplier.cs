using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels Recovery Services backup and replication edges with stored field honesty.</summary>
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
            if (!TryGetRecoveryServicesInferenceSource(diagramEdge.InferenceSource, out bool isReplication))
            {
                continue;
            }

            graphEdgesByDiagramEndpoints.TryGetValue(
                (diagramEdge.FromNodeId, diagramEdge.ToNodeId),
                out GraphEdge? graphEdge);

            diagramEdge.Label = isReplication
                ? InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesReplicatesLabel(ReadTargetRegion(graphEdge))
                : InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesProtectsLabel();
            diagramEdge.ProvenanceKind = graphEdge is null
                ? ProvenanceKind.DerivedFact.ToString()
                : ProvenanceKind.ObservedFact.ToString();
        }
    }

    private static bool TryGetRecoveryServicesInferenceSource(string? inferenceSource, out bool isReplication)
    {
        if (string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                StringComparison.OrdinalIgnoreCase))
        {
            isReplication = true;

            return true;
        }

        if (string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryRecoveryServicesProtects,
                StringComparison.OrdinalIgnoreCase))
        {
            isReplication = false;

            return true;
        }

        isReplication = false;

        return false;
    }

    private static string? ReadTargetRegion(GraphEdge? graphEdge)
    {
        if (graphEdge is null)
        {
            return null;
        }

        return graphEdge.Properties.TryGetValue(
            AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey,
            out string? storedRegion)
            ? storedRegion
            : null;
    }
}
