using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Labels visible connectors when no relationship verb was stored. Stored verbs are left unchanged.
/// </summary>
internal static class DiagramConnectionTypeAnnotator
{
    public const string RelationshipNotStoredLabel = "Relationship was not stored";

    public const string RelationshipLabelNotStoredLabel = "Relationship label was not stored.";

    public static void Annotate(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(edge.Label))
            {
                continue;
            }

            edge.Label = IsPrivateEndpointDiagramEdge(edge)
                ? InventoryDiagramRelationshipLabelTexts.PrivateEndpointAccessWasStoredLabel
                : RelationshipNotStoredLabel;
        }
    }

    private static bool IsPrivateEndpointDiagramEdge(DiagramEdge edge)
    {
        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   edge.Label,
                   InventoryDiagramRelationshipLabelTexts.PrivateAccess,
                   StringComparison.OrdinalIgnoreCase);
    }
}
