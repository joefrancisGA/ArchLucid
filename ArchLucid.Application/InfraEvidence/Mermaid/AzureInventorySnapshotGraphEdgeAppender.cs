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
}
