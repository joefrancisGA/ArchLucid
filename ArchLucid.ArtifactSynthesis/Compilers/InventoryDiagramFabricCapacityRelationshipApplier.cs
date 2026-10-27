using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels Fabric capacity to workspace edges (NR-40).</summary>
internal static class InventoryDiagramFabricCapacityRelationshipApplier
{
    public const string Label = "Fabric capacity assignment in configuration.";

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryFabricCapacityWorkspace,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            edge.Label = Label;
            edge.ProvenanceKind = ProvenanceKind.DerivedFact.ToString();
        }
    }
}
