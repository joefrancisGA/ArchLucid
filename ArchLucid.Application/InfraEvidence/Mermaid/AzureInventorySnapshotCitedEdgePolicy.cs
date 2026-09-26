using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
/// Distinguishes evidence-backed relationship rows from broad same-group placement guesses.
/// </summary>
internal static class AzureInventorySnapshotCitedEdgePolicy
{
    public static bool IsCited(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        string source = edge.InferenceSource ?? string.Empty;

        if (GraphEdgeInferenceSources.TrySplitQualifier(source, out string baseSource, out _))
        {
            source = baseSource;
        }

        return !source.Equals(GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase)
               && !source.Equals(GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
               && !source.Equals(GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
               && !source.Equals(GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase);
    }

    public static bool HasCitedEdgeFrom(
        IReadOnlyList<GraphEdge> edges,
        string fromNodeId,
        string? toNodeId = null)
    {
        ArgumentNullException.ThrowIfNull(edges);

        return edges.Any(edge =>
            string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
            && (string.IsNullOrWhiteSpace(toNodeId)
                || string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal))
            && IsCited(edge));
    }
}
