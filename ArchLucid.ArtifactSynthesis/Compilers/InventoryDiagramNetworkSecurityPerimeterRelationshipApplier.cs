using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels observed network security perimeter resource-association relationships (NR-37).</summary>
internal static class InventoryDiagramNetworkSecurityPerimeterRelationshipApplier
{
    public const string Label = InventoryDiagramRelationshipLabelTexts.NetworkSecurityPerimeterAssociationStoredObservedEnforcementNotStored;

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryNspAssociation,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            edge.Label = Label;
            edge.ProvenanceKind = ProvenanceKind.DerivedFact.ToString();
        }
    }
}
