using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Marks resource-group relationship guesses as visible but unproven (NR-29).</summary>
internal static class InventoryDiagramLikelyRelationshipApplier
{
    public const string OutlineSentence = "No stored link yet; inferred from resource group.";
    public const string StorageHostOutlineSentence =
        "No stored link yet; inferred from a redacted host reference.";

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, DiagramNode> nodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly).ToList())
        {
            bool isResourceGroupGuess = IsResourceGroupGuess(edge);
            bool isStorageHostGuess = IsStorageHostGuess(edge, nodesById);

            if (!isResourceGroupGuess && !isStorageHostGuess)
            {
                continue;
            }

            if (isStorageHostGuess
                && HasSolidEdgeBetween(ast, edge))
            {
                ast.Edges.Remove(edge);
                continue;
            }

            string outlineSentence = isStorageHostGuess
                ? StorageHostOutlineSentence
                : OutlineSentence;
            edge.Label = isStorageHostGuess ? "Likely" : OutlineSentence;
            edge.ProvenanceKind = ProvenanceKind.DeterministicInference.ToString();

            if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? sourceNode))
            {
                continue;
            }

            if (!sourceNode.UnresolvedRelationshipDetails.Contains(outlineSentence, StringComparer.Ordinal))
            {
                sourceNode.UnresolvedRelationshipDetails.Add(outlineSentence);
            }
        }
    }

    private static bool IsStorageHostGuess(
        DiagramEdge edge,
        IReadOnlyDictionary<string, DiagramNode> nodesById)
    {
        if (!string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryStorageHostRef,
                StringComparison.OrdinalIgnoreCase)
            || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? targetNode))
        {
            return false;
        }

        return targetNode.ArmResourceType?.Equals(
                   "Microsoft.Storage/storageAccounts",
                   StringComparison.OrdinalIgnoreCase)
               == true;
    }

    private static bool HasSolidEdgeBetween(DiagramAst ast, DiagramEdge candidate)
    {
        return ast.Edges.Any(edge =>
            !ReferenceEquals(edge, candidate)
            && !edge.IsLayoutOnly
            && !string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryStorageHostRef,
                StringComparison.OrdinalIgnoreCase)
            && ((edge.FromNodeId == candidate.FromNodeId && edge.ToNodeId == candidate.ToNodeId)
                || (edge.FromNodeId == candidate.ToNodeId && edge.ToNodeId == candidate.FromNodeId)));
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
