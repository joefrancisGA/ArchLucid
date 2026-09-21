namespace ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

/// <summary>
/// Deliberately small brute-force reachability oracle. It has no dependency on SecureNow traversal implementation.
/// </summary>
internal static class ReferenceReachabilityOracle
{
    internal static IReadOnlySet<string> EnumeratePathSignatures(
        string startNode,
        IReadOnlyDictionary<string, IReadOnlyList<(string ToNodeId, string EdgeType)>> outgoing,
        IReadOnlySet<string> terminalNodes,
        int maxDepth)
    {
        HashSet<string> results = new(StringComparer.Ordinal);
        Walk(startNode, [], new HashSet<string>(StringComparer.OrdinalIgnoreCase) { startNode });

        return results;

        void Walk(
            string current,
            List<(string FromNodeId, string EdgeType, string ToNodeId)> path,
            HashSet<string> visited)
        {
            if (path.Count > 0 && terminalNodes.Contains(current))
            {
                results.Add(Signature(path));
            }

            if (path.Count >= maxDepth || !outgoing.TryGetValue(current, out IReadOnlyList<(string ToNodeId, string EdgeType)>? edges))
            {
                return;
            }

            foreach ((string toNodeId, string edgeType) in edges)
            {
                if (!visited.Add(toNodeId))
                {
                    continue;
                }

                List<(string FromNodeId, string EdgeType, string ToNodeId)> next =
                    [.. path, (current, edgeType, toNodeId)];

                Walk(toNodeId, next, visited);
                visited.Remove(toNodeId);
            }
        }
    }

    internal static string Signature(
        IEnumerable<(string FromNodeId, string EdgeType, string ToNodeId)> path) =>
        string.Join(
            ">",
            path.Select(static hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"));
}
