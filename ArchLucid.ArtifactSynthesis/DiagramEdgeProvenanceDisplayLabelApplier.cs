using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis;

public static class DiagramEdgeProvenanceDisplayLabelApplier
{
    public static void ApplyToVisibleEdges(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (string.Equals(edge.ProvenanceKind, "HumanAssertion", StringComparison.OrdinalIgnoreCase))
            {
                edge.Label = DiagramEdgeProvenanceDisplayLabelBuilder.Build(
                    edge.Label,
                    DiagramEdgeVisualKind.Declared);

                continue;
            }

            if (ShouldPreserveDiagramEdgeLabel(edge))
            {
                continue;
            }

            DiagramEdgeVisualKind visualKind = DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource);

            if (visualKind == DiagramEdgeVisualKind.Observed)
            {
                continue;
            }

            edge.Label = DiagramEdgeProvenanceDisplayLabelBuilder.Build(edge.Label, visualKind);
        }
    }

    private static bool ShouldPreserveDiagramEdgeLabel(DiagramEdge edge)
    {
        if (string.IsNullOrWhiteSpace(edge.InferenceSource))
        {
            return false;
        }

        if (InventoryConnectionEndpointEdgeClassifier.IsAuthorizationOverlayEdge(
                new GraphEdge { InferenceSource = edge.InferenceSource }))
        {
            return true;
        }

        string label = edge.Label?.Trim() ?? string.Empty;

        if (label.Length == 0)
        {
            return false;
        }

        if (string.Equals(label, DiagramDataFlowHonestyLegend.MayAccessOverlayEdgeLabel, StringComparison.Ordinal)
            || string.Equals(label, InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel, StringComparison.Ordinal))
        {
            return true;
        }

        if (string.Equals(label, "Reads from", StringComparison.Ordinal)
            || string.Equals(label, "Writes to", StringComparison.Ordinal)
            || string.Equals(label, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored, StringComparison.Ordinal)
            || string.Equals(label, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored, StringComparison.Ordinal)
            || string.Equals(label, "Routes to", StringComparison.Ordinal)
            || string.Equals(label, "peering", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryNetworkConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryRouteTableRoute, StringComparison.OrdinalIgnoreCase))
        {
            return label.Length > 0;
        }

        return label.StartsWith("declared · ", StringComparison.Ordinal);
    }
}
