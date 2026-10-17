using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Identifies snapshot edges backed by a cited hop (association, property ARM id, composed path, peering, etc.).
///     Collocation guesses are never cited.
/// </summary>
internal static class AzureInventorySnapshotCitedHopPredicate
{
    public static bool IsCitedHop(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (IsUncitedCollocationGuess(edge))
        {
            return false;
        }

        if (AzureInventorySnapshotCitedEdgePolicy.IsCitedPlacement(edge))
        {
            return true;
        }

        if (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.LogicAppConnection, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(edge.EdgeType, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge);
    }

    public static bool HasCitedHopFrom(
        IReadOnlyList<GraphEdge> edges,
        string fromNodeId,
        string? toNodeId = null)
    {
        ArgumentNullException.ThrowIfNull(edges);

        return edges.Any(edge =>
            string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
            && (string.IsNullOrWhiteSpace(toNodeId)
                || string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal))
            && IsCitedHop(edge));
    }

    public static bool IsUncitedCollocationGuess(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        string source = edge.InferenceSource ?? string.Empty;

        if (GraphEdgeInferenceSources.TrySplitQualifier(source, out string baseSource, out _))
        {
            source = baseSource;
        }

        return source.Equals(GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase)
               || source.Equals(GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
               || source.Equals(GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
               || (source.Equals(GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase)
                   && string.Equals(edge.ProvenanceKind, ProvenanceKind.DeterministicInference.ToString(), StringComparison.OrdinalIgnoreCase));
    }
}
