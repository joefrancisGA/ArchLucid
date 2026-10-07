using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Marks resource-group relationship guesses as visible but unproven (NR-29).</summary>
internal static class InventoryDiagramLikelyRelationshipApplier
{
    public const string OutlineSentence = "No stored link yet; inferred from resource group.";

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, DiagramNode> nodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!IsResourceGroupGuess(edge))
            {
                continue;
            }

            edge.Label = "Likely";
            edge.ProvenanceKind = ProvenanceKind.DeterministicInference.ToString();

            if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? sourceNode))
            {
                continue;
            }

            if (!sourceNode.UnresolvedRelationshipDetails.Contains(OutlineSentence, StringComparer.Ordinal))
            {
                sourceNode.UnresolvedRelationshipDetails.Add(OutlineSentence);
            }
        }
    }

    private static bool IsResourceGroupGuess(DiagramEdge edge)
    {
        if (string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
                   StringComparison.OrdinalIgnoreCase)
               && string.Equals(
                   edge.ProvenanceKind,
                   ProvenanceKind.DeterministicInference.ToString(),
                   StringComparison.OrdinalIgnoreCase);
    }
}
