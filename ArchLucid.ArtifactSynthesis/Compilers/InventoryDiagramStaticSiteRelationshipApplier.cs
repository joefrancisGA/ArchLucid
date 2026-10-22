using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels Static Web App to linked backend edges (NR-42).</summary>
internal static class InventoryDiagramStaticSiteRelationshipApplier
{
    public const string Label = "Linked backend";

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryStaticSiteBackend,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            edge.Label = Label;
            edge.ProvenanceKind = ProvenanceKind.ObservedFact.ToString();
        }
    }
}
