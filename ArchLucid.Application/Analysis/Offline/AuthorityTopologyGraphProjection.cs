using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Application.Analysis;

/// <summary>Copies the effective graph, preserving its original evaluation order and exact identity.</summary>
internal sealed class AuthorityTopologyGraphProjection
{
    private const int MaxNodes = 256;
    private const int MaxEdges = 1024;
    private const int MaxTextLength = 2048;
    private const int MaxProperties = 32;
    private const int MaxContentCharacters = 2_000_000;

    private AuthorityTopologyGraphProjection(GraphSnapshot graph, string canonicalDigest)
    {
        Graph = graph;
        CanonicalDigest = canonicalDigest;
    }

    public GraphSnapshot Graph { get; }
    public string CanonicalDigest { get; }

    public static AuthorityTopologyGraphProjection? Capture(GraphSnapshot? graph)
    {
        if (graph is null || graph.GetType() != typeof(GraphSnapshot) || graph.SchemaVersion != 1
            || graph.GraphSnapshotId == Guid.Empty || graph.RunId == Guid.Empty || graph.ContextSnapshotId == Guid.Empty
            || graph.Nodes.Count is 0 or > MaxNodes || graph.Edges.Count > MaxEdges || graph.Warnings.Count > MaxNodes)
            return null;

        HashSet<string> nodes = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> edges = new(StringComparer.OrdinalIgnoreCase);
        int characters = 0;

        foreach (string warning in graph.Warnings)
        {
            if (!Track(warning))
                return null;
        }

        foreach (GraphNode node in graph.Nodes)
        {
            if (node is null || node.GetType() != typeof(GraphNode) || !ValidIdentifier(node.NodeId)
                || !nodes.Add(node.NodeId) || string.IsNullOrWhiteSpace(node.NodeType)
                || !Track(node.NodeId, node.NodeType, node.Label, node.Category, node.SourceId, node.SourceType, node.ReasoningTrace)
                || !TrackProperties(node.Properties))
                return null;
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge is null || edge.GetType() != typeof(GraphEdge) || !ValidIdentifier(edge.EdgeId)
                || !edges.Add(edge.EdgeId) || !double.IsFinite(edge.Weight) || string.IsNullOrWhiteSpace(edge.EdgeType)
                || !ValidIdentifier(edge.FromNodeId) || !ValidIdentifier(edge.ToNodeId)
                || !nodes.Contains(edge.FromNodeId) || !nodes.Contains(edge.ToNodeId)
                || !Track(edge.EdgeId, edge.FromNodeId, edge.ToNodeId, edge.EdgeType, edge.Label, edge.InferenceSource,
                    edge.ProvenanceKind, edge.DeclaredConnectionId, edge.ReasoningTrace)
                || !TrackProperties(edge.Properties))
                return null;
        }

        // Evaluate on the original array order. Only the candidate witness sorts nodes and edges.
        JsonObject document = JsonSerializer.SerializeToNode(graph)!.AsObject();
        GraphSnapshot copy = document.Deserialize<GraphSnapshot>()!;
        document.Remove(nameof(GraphSnapshot.GraphSnapshotId));
        // Graph creation time is an envelope field, not the pinned evidence observation/collection time.
        document.Remove(nameof(GraphSnapshot.CreatedUtc));
        SortRows(document, nameof(GraphSnapshot.Nodes), nameof(GraphNode.NodeId));
        SortRows(document, nameof(GraphSnapshot.Edges), nameof(GraphEdge.EdgeId));
        return new AuthorityTopologyGraphProjection(copy, AnalysisDependencyFingerprint.Digest(document));

        bool Track(params string?[] values)
        {
            foreach (string? value in values)
            {
                if (value is null)
                    continue;

                if (value.Length > MaxTextLength || !IsWellFormedUtf16(value))
                    return false;

                characters += value.Length;

                if (characters > MaxContentCharacters)
                    return false;
            }

            return true;
        }

        bool TrackProperties(Dictionary<string, string> properties) => properties.Count <= MaxProperties
            && properties.All(property => Track(property.Key, property.Value));
    }

    private static bool ValidIdentifier(string? id) =>
        !string.IsNullOrWhiteSpace(id) && id.Length == id.Trim().Length;

    private static bool IsWellFormedUtf16(string text)
    {
        for (int i = 0; i < text.Length; i++)
        {
            char scalar = text[i];

            if (!char.IsSurrogate(scalar))
                continue;

            if (!char.IsHighSurrogate(scalar) || i + 1 == text.Length || !char.IsLowSurrogate(text[++i]))
                return false;
        }

        return true;
    }

    private static void SortRows(JsonObject document, string field, string id)
    {
        JsonNode?[] rows = document[field]!.AsArray().OrderBy(row => row![id]!.GetValue<string>(), StringComparer.Ordinal)
            .Select(row => row!.DeepClone()).ToArray();
        document[field] = new JsonArray(rows);
    }
}
