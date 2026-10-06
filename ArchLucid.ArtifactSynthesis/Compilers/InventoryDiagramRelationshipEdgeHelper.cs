using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class InventoryDiagramRelationshipEdgeHelper
{
    public static void ReplaceOrAddDirectedEdge(
        DiagramAst ast,
        string fromNodeId,
        string toNodeId,
        string label,
        string inferenceSource,
        string provenanceKind)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentException.ThrowIfNullOrWhiteSpace(fromNodeId);
        ArgumentException.ThrowIfNullOrWhiteSpace(toNodeId);
        ArgumentException.ThrowIfNullOrWhiteSpace(label);
        ArgumentException.ThrowIfNullOrWhiteSpace(inferenceSource);
        ArgumentException.ThrowIfNullOrWhiteSpace(provenanceKind);

        DiagramEdge? existingEdge = ast.Edges.FirstOrDefault(edge =>
            !edge.IsLayoutOnly
            && string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal));

        if (existingEdge is not null)
        {
            existingEdge.Label = label;
            existingEdge.InferenceSource = inferenceSource;
            existingEdge.ProvenanceKind = provenanceKind;
            return;
        }

        string pairKey = BuildUndirectedPairKey(fromNodeId, toNodeId);
        DiagramEdge? reverseEdge = ast.Edges.FirstOrDefault(edge =>
            !edge.IsLayoutOnly
            && BuildUndirectedPairKey(edge.FromNodeId, edge.ToNodeId).Equals(pairKey, StringComparison.Ordinal));

        if (reverseEdge is not null)
        {
            ast.Edges.Remove(reverseEdge);
        }

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = label,
            InferenceSource = inferenceSource,
            ProvenanceKind = provenanceKind,
        });
    }

    public static void RemoveGenericEdgesBetween(DiagramAst ast, string fromNodeId, string toNodeId)
    {
        ast.Edges.RemoveAll(edge =>
            !edge.IsLayoutOnly
            && ((string.Equals(edge.FromNodeId, fromNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.ToNodeId, toNodeId, StringComparison.Ordinal))
                || (string.Equals(edge.FromNodeId, toNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.ToNodeId, fromNodeId, StringComparison.Ordinal)))
            && IsGenericShortcutLabel(edge.Label));
    }

    private static bool IsGenericShortcutLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return true;
        }

        string trimmed = label.Trim();

        return trimmed.Equals("Connected", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("in", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("Routes to", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("via NIC:", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildUndirectedPairKey(string leftId, string rightId)
    {
        if (string.CompareOrdinal(leftId, rightId) <= 0)
        {
            return leftId + "|" + rightId;
        }

        return rightId + "|" + leftId;
    }
}
