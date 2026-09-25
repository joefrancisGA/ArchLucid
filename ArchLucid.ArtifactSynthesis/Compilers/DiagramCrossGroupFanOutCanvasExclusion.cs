using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Hides cross-group <c>applies</c> and <c>likely ·</c> fan-out edges from painted canvases unless opted in.
/// </summary>
internal static class DiagramCrossGroupFanOutCanvasExclusion
{
    private const string LikelyPrefix = "likely ·";

    public static IEnumerable<DiagramEdge> FilterCanvasEdges(
        IReadOnlyList<DiagramNode> nodes,
        IEnumerable<DiagramEdge> edges,
        bool includeCrossGroupFanOut)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        if (includeCrossGroupFanOut)
        {
            return edges;
        }

        Dictionary<string, DiagramNode> nodesById = nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        return edges.Where(edge => !ShouldExclude(nodesById, edge));
    }

    public static bool ShouldExclude(IReadOnlyDictionary<string, DiagramNode> nodesById, DiagramEdge edge)
    {
        ArgumentNullException.ThrowIfNull(nodesById);
        ArgumentNullException.ThrowIfNull(edge);

        if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? fromNode)
            || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? toNode))
        {
            return false;
        }

        string? fromGroup = NormalizeResourceGroup(fromNode.ArmResourceGroup);
        string? toGroup = NormalizeResourceGroup(toNode.ArmResourceGroup);

        if (fromGroup is null || toGroup is null)
        {
            return false;
        }

        if (string.Equals(fromGroup, toGroup, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return IsHiddenFanOutLabel(edge.Label);
    }

    public static bool IsHiddenFanOutLabel(string? label)
    {
        string trimmed = label?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            return false;
        }

        if (string.Equals(trimmed, "applies", StringComparison.Ordinal))
        {
            return true;
        }

        return trimmed.StartsWith(LikelyPrefix, StringComparison.Ordinal);
    }

    private static string? NormalizeResourceGroup(string? armResourceGroup)
    {
        if (string.IsNullOrWhiteSpace(armResourceGroup))
        {
            return null;
        }

        return armResourceGroup.Trim();
    }
}
