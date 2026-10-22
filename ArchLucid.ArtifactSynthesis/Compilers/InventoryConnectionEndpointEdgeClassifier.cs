using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Identifies inventory connection edges whose endpoints must be kept on filtered diagrams
///     (authorization overlay, diagnostics, hostname inference, proven linkers).
/// </summary>
internal static class InventoryConnectionEndpointEdgeClassifier
{
    public static bool IsConnectionEndpointEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (string.Equals(edge.EdgeType, GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string? inferenceSource = edge.InferenceSource;

        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        return inferenceSource.Equals(GraphEdgeInferenceSources.InventoryAppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryHostnameInferredTarget, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryServiceConnectorLink, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryEventGridDestination, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsAuthorizationOverlayEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (string.Equals(edge.EdgeType, GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(
            edge.InferenceSource,
            GraphEdgeInferenceSources.InventoryAppAuthorizedAccess,
            StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
                StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryHostnameInferredTarget,
                StringComparison.OrdinalIgnoreCase);
    }

    public static bool ShouldIncludeEdgeOnMode(GraphEdge edge, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (!IsConnectionEndpointEdge(edge))
        {
            return false;
        }

        if (mode == DiagramMode.Network && IsAuthorizationOverlayEdge(edge))
        {
            return false;
        }

        return mode is DiagramMode.Executive
            or DiagramMode.Identity
            or DiagramMode.Data
            or DiagramMode.DataArchitecture
            or DiagramMode.DataFlow;
    }
}
