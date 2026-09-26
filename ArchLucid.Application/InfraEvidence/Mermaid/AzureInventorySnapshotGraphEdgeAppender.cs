using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Dedupes graph edges emitted by snapshot hydrators.</summary>
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
        string? provenanceKind = null)
    {
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        if (string.IsNullOrWhiteSpace(fromNodeId)
            || string.IsNullOrWhiteSpace(toNodeId)
            || string.IsNullOrWhiteSpace(edgeType))
        {
            return;
        }

        if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
        {
            return;
        }

        string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";

        if (!edgeKeys.Add(edgeKey))
        {
            int existingIndex = edges.FindIndex(edge =>
                string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
                && string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal)
                && string.Equals(edge.EdgeType, edgeType, StringComparison.Ordinal));

            if (existingIndex >= 0
                && ProvenanceRank(provenanceKind) > ProvenanceRank(edges[existingIndex].ProvenanceKind))
            {
                edges[existingIndex] = new GraphEdge
                {
                    EdgeId = $"edge-{edgeKey}",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = edgeType,
                    Label = string.IsNullOrWhiteSpace(label) ? edgeType : label,
                    Weight = 1.0d,
                    InferenceSource = inferenceSource,
                    ProvenanceKind = string.IsNullOrWhiteSpace(provenanceKind)
                        ? ProvenanceKind.ObservedFact.ToString()
                        : provenanceKind,
                };
            }

            return;
        }

        edges.Add(new GraphEdge
        {
            EdgeId = $"edge-{edgeKey}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = string.IsNullOrWhiteSpace(label) ? edgeType : label,
            Weight = 1.0d,
            InferenceSource = inferenceSource,
            ProvenanceKind = string.IsNullOrWhiteSpace(provenanceKind)
                ? ProvenanceKind.ObservedFact.ToString()
                : provenanceKind,
        });
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
