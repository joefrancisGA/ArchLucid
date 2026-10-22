namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PrivilegePathGraphEdgeSorter
{
    internal static void SortOutgoingEdges(IReadOnlyDictionary<string, List<PrivilegePathEdge>> outgoing)
    {
        foreach (List<PrivilegePathEdge> edges in outgoing.Values)
        {
            edges.Sort(static (left, right) =>
                StringComparer.Ordinal.Compare(left.EdgeType, right.EdgeType));
        }
    }
}
