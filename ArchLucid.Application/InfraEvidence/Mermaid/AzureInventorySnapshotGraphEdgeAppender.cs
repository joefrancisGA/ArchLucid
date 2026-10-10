using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Constructs and dedupes snapshot edges while preserving each caller's evidence policy.</summary>
internal static class AzureInventorySnapshotGraphEdgeAppender
{
    public static void TryAdd(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource,
        string? label = null,
        string? provenanceKind = null,
        bool promoteStrongerProvenance = true,
        bool preserveNullProvenance = false)
    {
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        if (string.IsNullOrWhiteSpace(fromNodeId)
            || string.IsNullOrWhiteSpace(toNodeId)
            || string.IsNullOrWhiteSpace(edgeType))
        {
            return;
        }

        Append(edges, edgeKeys, fromNodeId, toNodeId, edgeType, inferenceSource, label, provenanceKind,
            declaredConnectionId: null, promoteStrongerProvenance: promoteStrongerProvenance,
            preserveNullProvenance: preserveNullProvenance);
    }

    /// <summary>
    ///     Explicit relationships keep the first duplicate, including its declaration and nullable source.
    ///     An empty resolved edge type is retained, matching the captured relationship's existing behavior.
    /// </summary>
    public static void TryAddRelationship(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        AzureInventoryResourceRelationshipReadModel relationship)
    {
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);
        ArgumentNullException.ThrowIfNull(relationship);

        Append(edges, edgeKeys, fromNodeId, toNodeId, edgeType, relationship.InferenceSource, edgeType,
            relationship.ProvenanceKind.ToString(), relationship.DeclaredConnectionId?.ToString(),
            promoteStrongerProvenance: false);
    }

    private static void Append(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string? inferenceSource,
        string? label,
        string? provenanceKind,
        string? declaredConnectionId,
        bool promoteStrongerProvenance,
        bool preserveNullProvenance = false)
    {
        if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
        {
            return;
        }

        string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";
        int existingIndex = -1;

        if (!edgeKeys.Add(edgeKey))
        {
            if (!promoteStrongerProvenance)
            {
                return;
            }

            existingIndex = edges.FindIndex(edge =>
                string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
                && string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal)
                && string.Equals(edge.EdgeType, edgeType, StringComparison.Ordinal));

            if (existingIndex < 0
                || ProvenanceRank(provenanceKind) <= ProvenanceRank(edges[existingIndex].ProvenanceKind))
            {
                return;
            }
        }

        GraphEdge edge = new()
        {
            EdgeId = $"edge-{edgeKey}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = string.IsNullOrWhiteSpace(label) ? edgeType : label,
            Weight = 1.0d,
            InferenceSource = inferenceSource,
            // Some inventory producers historically leave provenance unset; preserve that when requested.
            ProvenanceKind = preserveNullProvenance && provenanceKind is null
                ? null
                : string.IsNullOrWhiteSpace(provenanceKind)
                ? ProvenanceKind.ObservedFact.ToString()
                : provenanceKind,
            DeclaredConnectionId = declaredConnectionId,
        };

        if (existingIndex >= 0)
        {
            edges[existingIndex] = edge;
        }
        else
        {
            edges.Add(edge);
        }
    }

    private static int ProvenanceRank(string? provenanceKind)
    {
        return provenanceKind switch
        {
            nameof(ProvenanceKind.ObservedFact) => 3,
            nameof(ProvenanceKind.HumanAssertion) => 2,
            nameof(ProvenanceKind.DerivedFact) => 1,
            nameof(ProvenanceKind.DeterministicInference) => 0,
            _ => 0,
        };
    }
}
