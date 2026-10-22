using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Shared cap checks for privilege and reachability enumeration.</summary>
internal static class SecurityEvidencePathSearchLimitGuard
{
    public static bool StopForDepth(
        SecurityEvidencePathSearchLimitTracker limits,
        PrivilegePathEngineOptions options,
        int pathCount,
        IReadOnlyDictionary<string, List<PrivilegePathEdge>> outgoing,
        string currentNode,
        HashSet<string> visited)
    {
        if (pathCount < options.MaxDepth)
        {
            return false;
        }

        if (outgoing.TryGetValue(currentNode, out List<PrivilegePathEdge>? deeper)
            && deeper.Any(edge => !visited.Contains(edge.ToNodeId)))
        {
            limits.RecordMaxDepth();
        }

        return true;
    }

    public static bool StopForPathCap(
        SecurityEvidencePathSearchLimitTracker limits,
        PrivilegePathEngineOptions options,
        int resultCount,
        IEnumerable<PrivilegePathEdge> edges,
        HashSet<string> visited)
    {
        if (resultCount < options.MaxPaths)
        {
            return false;
        }

        if (edges.Any(edge => !visited.Contains(edge.ToNodeId)))
        {
            limits.RecordMaxPaths();
        }

        return true;
    }

    public static bool StopForFanOut(
        SecurityEvidencePathSearchLimitTracker limits,
        PrivilegePathEngineOptions options,
        int fanOut,
        IEnumerable<PrivilegePathEdge> edges,
        HashSet<string> visited)
    {
        if (fanOut < options.MaxFanOutPerNode)
        {
            return false;
        }

        if (edges.Any(edge => !visited.Contains(edge.ToNodeId)))
        {
            limits.RecordMaxFanOut();
        }

        return true;
    }
}
