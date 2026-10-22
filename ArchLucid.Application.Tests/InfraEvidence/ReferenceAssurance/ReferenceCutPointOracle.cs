namespace ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

/// <summary>
/// Brute-force path-collapse counter. It knows only path tuples, not production cut-point implementation.
/// </summary>
internal static class ReferenceCutPointOracle
{
    internal static IReadOnlyDictionary<string, int> CountCollapsedPaths(
        IReadOnlyDictionary<Guid, IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>> paths)
    {
        Dictionary<string, HashSet<Guid>> collapsed = new(StringComparer.Ordinal);

        foreach ((Guid pathId, IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)> hops) in paths)
        {
            foreach ((string fromNodeId, string edgeType, string toNodeId) in hops)
            {
                Add($"edge:{fromNodeId}|{edgeType}|{toNodeId}", pathId);

                if (IsEligibleNode(fromNodeId))
                {
                    Add($"node:{fromNodeId}", pathId);
                }

                if (IsEligibleNode(toNodeId))
                {
                    Add($"node:{toNodeId}", pathId);
                }
            }
        }

        return collapsed.ToDictionary(pair => pair.Key, pair => pair.Value.Count, StringComparer.Ordinal);

        void Add(string key, Guid pathId)
        {
            if (!collapsed.TryGetValue(key, out HashSet<Guid>? pathIds))
            {
                pathIds = [];
                collapsed[key] = pathIds;
            }

            pathIds.Add(pathId);
        }
    }

    private static bool IsEligibleNode(string nodeId) =>
        !string.IsNullOrWhiteSpace(nodeId)
        && !nodeId.StartsWith("internet://", StringComparison.OrdinalIgnoreCase);
}
