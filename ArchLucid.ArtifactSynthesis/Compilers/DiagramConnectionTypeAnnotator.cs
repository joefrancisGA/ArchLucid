using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Labels visible connectors when no relationship verb was stored. Stored verbs are left unchanged.
/// </summary>
internal static class DiagramConnectionTypeAnnotator
{
    public const string RelationshipNotStoredLabel = "Relationship was not stored";

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

            edge.Label = RelationshipNotStoredLabel;
        }
    }
}
