using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Places disconnected visible-edge components on a 2–4 column TD grid using
/// layout-only <c>~~~</c> links. Do not wrap those components in subgraphs —
/// Mermaid 11 flips edge-free subgraphs to LR.
/// </summary>
internal static class DiagramComponentRowPlanner
{
    /// <summary>
    /// Column count for a forest of <paramref name="componentCount"/> components.
    /// Uses <c>clamp(ceil(sqrt(n)), 2, 4)</c> so five components become three columns
    /// (unlike the zero-edge peer-grid aspect factor, which yields four columns for five nodes).
    /// </summary>
    internal static int ResolveColumnCount(int componentCount)
    {
        if (componentCount <= 1)
        {
            return 1;
        }

        int columns = (int)Math.Ceiling(Math.Sqrt(componentCount));

        if (columns < 2)
        {
            return 2;
        }

        if (columns > 4)
        {
            return 4;
        }

        return columns;
    }

    /// <summary>
    /// Builds layout-only edges that stack later component rows under earlier ones
    /// so dagre keeps the forest in a compact plate instead of one wide rank.
    /// </summary>
    internal static IReadOnlyList<DiagramEdge> BuildAlignmentLinks(
        IReadOnlyList<IReadOnlyList<DiagramNode>> components,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(components);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        List<IReadOnlyList<DiagramNode>> ordered = OrderComponents(components);

        if (ordered.Count <= 1)
        {
            return [];
        }

        int columnCount = ResolveColumnCount(ordered.Count);
        List<List<IReadOnlyList<DiagramNode>>> rows = ChunkRows(ordered, columnCount);
        List<DiagramEdge> links = [];

        for (int rowIndex = 0; rowIndex < rows.Count - 1; rowIndex++)
        {
            List<IReadOnlyList<DiagramNode>> currentRow = rows[rowIndex];
            List<IReadOnlyList<DiagramNode>> nextRow = rows[rowIndex + 1];
            int pairedColumns = Math.Min(currentRow.Count, nextRow.Count);

            for (int column = 0; column < pairedColumns; column++)
            {
                string fromId = ResolveSinkNodeId(currentRow[column], visibleEdges);
                string toId = ResolveHeadNodeId(nextRow[column]);
                TryAddAlignmentLink(links, fromId, toId);
            }

            AppendLeftoverHeadLinks(links, currentRow, nextRow, visibleEdges);
        }

        return links;
    }

    internal static string ResolveHeadNodeId(IReadOnlyList<DiagramNode> component)
    {
        ArgumentNullException.ThrowIfNull(component);

        if (component.Count == 0)
        {
            throw new ArgumentException("Component must contain at least one node.", nameof(component));
        }

        return component
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .First()
            .NodeId;
    }

    /// <summary>
    /// Sink = a node with no outgoing visible edge inside the component.
    /// Several sinks: max <see cref="DiagramNode.OrderKey"/> then <see cref="DiagramNode.NodeId"/>.
    /// </summary>
    internal static string ResolveSinkNodeId(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (component.Count == 0)
        {
            throw new ArgumentException("Component must contain at least one node.", nameof(component));
        }

        HashSet<string> memberIds = component
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> withOutgoing = visibleEdges
            .Where(edge =>
                edge is not null
                && !edge.IsLayoutOnly
                && memberIds.Contains(edge.FromNodeId)
                && memberIds.Contains(edge.ToNodeId))
            .Select(edge => edge.FromNodeId)
            .ToHashSet(StringComparer.Ordinal);
        List<DiagramNode> sinks = component
            .Where(node => !withOutgoing.Contains(node.NodeId))
            .ToList();
        IEnumerable<DiagramNode> candidates = sinks.Count > 0 ? sinks : component;

        return candidates
            .OrderByDescending(node => node.OrderKey)
            .ThenByDescending(node => node.NodeId, StringComparer.Ordinal)
            .First()
            .NodeId;
    }

    internal static List<IReadOnlyList<DiagramNode>> OrderComponents(
        IReadOnlyList<IReadOnlyList<DiagramNode>> components)
    {
        return components
            .Where(static component => component is not null && component.Count > 0)
            .OrderByDescending(static component => component.Count)
            .ThenBy(static component => component.Min(static node => node.OrderKey))
            .ThenBy(static component => component.Min(static node => node.NodeId), StringComparer.Ordinal)
            .ToList();
    }

    internal static List<List<IReadOnlyList<DiagramNode>>> ChunkRows(
        IReadOnlyList<IReadOnlyList<DiagramNode>> ordered,
        int columnCount)
    {
        List<List<IReadOnlyList<DiagramNode>>> rows = [];

        for (int index = 0; index < ordered.Count; index += columnCount)
        {
            int take = Math.Min(columnCount, ordered.Count - index);
            rows.Add(ordered.Skip(index).Take(take).ToList());
        }

        return rows;
    }

    private static void AppendLeftoverHeadLinks(
        List<DiagramEdge> links,
        IReadOnlyList<IReadOnlyList<DiagramNode>> currentRow,
        IReadOnlyList<IReadOnlyList<DiagramNode>> nextRow,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        if (nextRow.Count > currentRow.Count)
        {
            string lastSinkId = ResolveSinkNodeId(currentRow[currentRow.Count - 1], visibleEdges);

            for (int leftover = currentRow.Count; leftover < nextRow.Count; leftover++)
            {
                TryAddAlignmentLink(links, lastSinkId, ResolveHeadNodeId(nextRow[leftover]));
            }

            return;
        }

        if (nextRow.Count >= currentRow.Count)
        {
            return;
        }

        // Last row is shorter than the previous. Pin leftover heads under the
        // TD-last sink (bottom of the tallest previous-row component) so they
        // stay on the next rank instead of a disconnected island.
        IReadOnlyList<DiagramNode> tallest = currentRow
            .OrderByDescending(static component => component.Count)
            .ThenBy(static component => component.Min(static node => node.OrderKey))
            .First();
        string deepestSinkId = ResolveSinkNodeId(tallest, visibleEdges);

        foreach (IReadOnlyList<DiagramNode> leftover in nextRow)
        {
            TryAddAlignmentLink(links, deepestSinkId, ResolveHeadNodeId(leftover));
        }
    }

    private static void TryAddAlignmentLink(List<DiagramEdge> links, string fromId, string toId)
    {
        if (string.IsNullOrWhiteSpace(fromId) || string.IsNullOrWhiteSpace(toId))
        {
            return;
        }

        if (string.Equals(fromId, toId, StringComparison.Ordinal))
        {
            return;
        }

        bool duplicate = links.Any(existing =>
            string.Equals(existing.FromNodeId, fromId, StringComparison.Ordinal)
            && string.Equals(existing.ToNodeId, toId, StringComparison.Ordinal));

        if (duplicate)
        {
            return;
        }

        links.Add(new DiagramEdge
        {
            FromNodeId = fromId,
            ToNodeId = toId,
            Label = string.Empty,
            IsLayoutOnly = true,
        });
    }
}
