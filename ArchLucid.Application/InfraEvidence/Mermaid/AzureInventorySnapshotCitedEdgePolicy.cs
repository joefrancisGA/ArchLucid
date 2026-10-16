using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
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

    public static bool IsCitedPlacement(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (!IsCited(edge))
        {
            return false;
        }

        if (IsKnownPlacementAssociation(edge.EdgeType))
        {
            return true;
        }

        string source = edge.InferenceSource ?? string.Empty;

        if (GraphEdgeInferenceSources.TrySplitQualifier(source, out string baseSource, out _))
        {
            source = baseSource;
        }

        return IsKnownPlacementInference(source);
    }

    private static bool IsKnownPlacementAssociation(string? association)
    {
        return string.Equals(association, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(association, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(association, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsKnownPlacementInference(string source)
    {
        return string.Equals(source, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryAppServiceSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase);
    }
}
