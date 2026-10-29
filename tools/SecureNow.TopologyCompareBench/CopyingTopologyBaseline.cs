using ArchLucid.Application.SecureNow;

namespace SecureNow.TopologyCompareBench;

/// <summary>
/// Frozen implementation before PR #5494 (per-child HashSet copy).
/// Benchmark-only comparison, never referenced by production or application services.
/// </summary>
internal static class CopyingTopologyBaseline
{
    internal static SecureNowTopologyCardinalityForecast.Result Count(
        IReadOnlyDictionary<string, IReadOnlyList<string>> adjacency,
        IReadOnlyCollection<string> seeds, int maxDepth, long maxPrefixes)
    {
        ArgumentNullException.ThrowIfNull(adjacency);
        ArgumentNullException.ThrowIfNull(seeds);
        if (maxDepth is < 0 or > 64 || maxPrefixes < 1)
            throw new ArgumentOutOfRangeException(nameof(maxDepth));
        if (adjacency.Count > 1_000_000 || seeds.Count > 1_000_000)
            throw new ArgumentOutOfRangeException(nameof(adjacency));

        long count = 0, traversed = 0;
        HashSet<string> seenNodes = new(StringComparer.Ordinal);
        foreach (string seed in seeds.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(seed))
                throw new ArgumentException("Seed IDs must be nonblank.", nameof(seeds));
            Stack<(string Node, int Depth, HashSet<string> Path)> stack = new();
            stack.Push((seed, 0, new HashSet<string>(StringComparer.Ordinal) { seed }));
            while (stack.Count > 0)
            {
                if (count >= maxPrefixes)
                    return new(count, traversed, seenNodes.Count, true, "TOPOLOGY_PREFIX_COUNT_TRUNCATED");

                var current = stack.Pop();
                count++;
                seenNodes.Add(current.Node);
                if (current.Depth >= maxDepth ||
                    !adjacency.TryGetValue(current.Node, out IReadOnlyList<string>? neighbors))
                    continue;

                foreach (string next in neighbors.Distinct(StringComparer.Ordinal)
                             .OrderByDescending(x => x, StringComparer.Ordinal))
                {
                    if (string.IsNullOrWhiteSpace(next))
                        throw new ArgumentException("Neighbor IDs must be nonblank.", nameof(adjacency));
                    traversed++;
                    if (current.Path.Contains(next))
                        continue;
                    HashSet<string> path = new(current.Path, StringComparer.Ordinal) { next };
                    stack.Push((next, current.Depth + 1, path));
                }
            }
        }
        return new(count, traversed, seenNodes.Count, false, "TOPOLOGY_STRUCTURAL_ONLY");
    }
}
