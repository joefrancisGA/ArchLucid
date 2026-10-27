using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels AMPLS scoped-resource relationships (NR-38).</summary>
internal static class InventoryDiagramMonitorPrivateLinkScopeRelationshipApplier
{
    public const string Label = "Private link scope member in configuration.";

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryAmplsScopedResource,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            edge.Label = Label;
            edge.ProvenanceKind = ProvenanceKind.DerivedFact.ToString();
        }
    }
}
