namespace ArchLucid.Application.SecureNow;

/// <summary>Counts bounded directed simple-path prefixes; no security-path semantic filtering.</summary>
public static class SecureNowTopologyCardinalityForecast
{
    public sealed record Result(long PrefixCount, long TraversedEdges, int VisitedNodes,
        bool Truncated, string EvidenceStatus);

    private sealed record Frame(string Node, int Depth, string[] Neighbors, int NextIndex);

    public static Result Count(
        IReadOnlyDictionary<string, IReadOnlyList<string>> adjacency,
        IReadOnlyCollection<string> seeds, int maxDepth, long maxPrefixes = 1_000_000)
    {
        ArgumentNullException.ThrowIfNull(adjacency);
        ArgumentNullException.ThrowIfNull(seeds);
        if (maxDepth is < 0 or > 64 || maxPrefixes < 1)
            throw new ArgumentOutOfRangeException(nameof(maxDepth));
        if (adjacency.Count > 1_000_000 || seeds.Count > 1_000_000)
            throw new ArgumentOutOfRangeException(nameof(adjacency), "Graph exceeds bounded analysis input.");

        long count = 0, traversed = 0;
        HashSet<string> seen = new(StringComparer.Ordinal);
        HashSet<string> activePath = new(StringComparer.Ordinal);
        Stack<Frame> stack = new();

        string[] Children(string node, int depth)
        {
            if (depth >= maxDepth || !adjacency.TryGetValue(node, out var neighbors))
                return [];
            // Descending order matches the original LIFO processing order.
            return neighbors.Distinct(StringComparer.Ordinal)
                .OrderBy(x => x, StringComparer.Ordinal).ToArray();
        }

        foreach (string seed in seeds.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(seed))
                throw new ArgumentException("Seed IDs must be nonblank.", nameof(seeds));
            activePath.Add(seed);
            stack.Push(new Frame(seed, 0, Children(seed, 0), 0));
            while (stack.Count > 0)
            {
                Frame frame = stack.Pop();
                if (frame.NextIndex == 0)
                {
                    if (count >= maxPrefixes)
                        return new Result(count, traversed, seen.Count, true, "TOPOLOGY_PREFIX_COUNT_TRUNCATED");
                    count++;
                    seen.Add(frame.Node);
                }
                if (frame.NextIndex >= frame.Neighbors.Length)
                {
                    activePath.Remove(frame.Node);
                    continue;
                }
                string next = frame.Neighbors[frame.NextIndex];
                stack.Push(frame with { NextIndex = frame.NextIndex + 1 });
                if (string.IsNullOrWhiteSpace(next))
                    throw new ArgumentException("Neighbor IDs must be nonblank.", nameof(adjacency));
                traversed++;
                if (activePath.Contains(next))
                    continue;
                activePath.Add(next);
                stack.Push(new Frame(next, frame.Depth + 1, Children(next, frame.Depth + 1), 0));
            }
        }
        return new Result(count, traversed, seen.Count, false, "TOPOLOGY_STRUCTURAL_ONLY");
    }
}
