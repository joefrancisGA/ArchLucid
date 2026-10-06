using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Normalizes hidden private-endpoint shortcuts to Private access (NR-24).</summary>
internal static class InventoryDiagramPrivateAccessRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        bool retainNetworkDetailNodes)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        if (retainNetworkDetailNodes)
        {
            ast.Edges.RemoveAll(edge => !edge.IsLayoutOnly && IsPrivateAccessEdge(edge));

            return;
        }

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly).ToList())
        {
            if (!IsPrivateEndpointEdge(edge))
            {
                continue;
            }

            edge.Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess;
            InventoryDiagramRelationshipEdgeHelper.RemoveGenericEdgesBetween(ast, edge.FromNodeId, edge.ToNodeId);
        }
    }

    private static bool IsPrivateEndpointEdge(DiagramEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, "private endpoint", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateAccessEdge(DiagramEdge edge)
    {
        return string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase);
    }
}
