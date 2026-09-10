using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecureNowArchitectNeighborhoodFilter
{
    public static IReadOnlyDictionary<string, Guid> BuildCloudResourceIdByArmId(
        AzureInventorySnapshotDetailReadModel snapshot) =>
        snapshot.Resources
            .Where(resource => resource.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            .ToDictionary(resource => resource.AzureResourceId, resource => resource.CloudResourceId!.Value, StringComparer.OrdinalIgnoreCase);

    public static bool CandidateTouchesSeeds(
        PrivilegePathCandidate candidate,
        IReadOnlySet<Guid> seedCloudResourceIds,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        if (candidate.TerminalCloudResourceId is Guid terminalId && seedCloudResourceIds.Contains(terminalId))
        {
            return true;
        }

        foreach (PrivilegePathEdge hop in candidate.Hops)
        {

            if (NodeIdTouchesSeeds(hop.FromNodeId, seedCloudResourceIds, cloudResourceIdByArmId)
                || NodeIdTouchesSeeds(hop.ToNodeId, seedCloudResourceIds, cloudResourceIdByArmId))
            {
                return true;
            }
        }

        return false;
    }

    public static bool CandidateTouchesSeeds(
        ReachabilityPathCandidate candidate,
        IReadOnlySet<Guid> seedCloudResourceIds,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        if (candidate.TerminalCloudResourceId is Guid terminalId && seedCloudResourceIds.Contains(terminalId))
        {
            return true;
        }

        foreach (PrivilegePathEdge hop in candidate.Hops)
        {

            if (NodeIdTouchesSeeds(hop.FromNodeId, seedCloudResourceIds, cloudResourceIdByArmId)
                || NodeIdTouchesSeeds(hop.ToNodeId, seedCloudResourceIds, cloudResourceIdByArmId))
            {
                return true;
            }
        }

        return false;
    }

    public static bool PathTouchesSeeds(
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlySet<Guid> seedCloudResourceIds,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        foreach (SecurityEvidencePathHopRecord hop in hops)
        {

            if (hop.CloudResourceId is Guid cloudResourceId && seedCloudResourceIds.Contains(cloudResourceId))
            {
                return true;
            }

            if (NodeIdTouchesSeeds(hop.FromNodeId, seedCloudResourceIds, cloudResourceIdByArmId)
                || NodeIdTouchesSeeds(hop.ToNodeId, seedCloudResourceIds, cloudResourceIdByArmId))
            {
                return true;
            }
        }

        return false;
    }

    public static bool ToxicCombinationTouchesSeeds(
        ToxicCombinationCandidate candidate,
        IReadOnlySet<Guid> seedCloudResourceIds,
        IReadOnlyDictionary<Guid, ToxicCombinationPathSnapshot> reachabilityByPathId,
        IReadOnlyDictionary<Guid, ToxicCombinationPathSnapshot> privilegeByPathId,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        if (candidate.TerminalCloudResourceId is Guid terminalId && seedCloudResourceIds.Contains(terminalId))
        {
            return true;
        }

        if (reachabilityByPathId.TryGetValue(candidate.ReachabilityPathId, out ToxicCombinationPathSnapshot? reachability)
            && PathTouchesSeeds(reachability.Hops, seedCloudResourceIds, cloudResourceIdByArmId))
        {
            return true;
        }

        if (privilegeByPathId.TryGetValue(candidate.PrivilegePathId, out ToxicCombinationPathSnapshot? privilege)
            && PathTouchesSeeds(privilege.Hops, seedCloudResourceIds, cloudResourceIdByArmId))
        {
            return true;
        }

        return false;
    }

    private static bool NodeIdTouchesSeeds(
        string nodeId,
        IReadOnlySet<Guid> seedCloudResourceIds,
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return false;
        }

        if (cloudResourceIdByArmId.TryGetValue(nodeId, out Guid mappedId))
        {
            return seedCloudResourceIds.Contains(mappedId);
        }

        foreach (KeyValuePair<string, Guid> pair in cloudResourceIdByArmId)
        {

            if (nodeId.EndsWith(pair.Key, StringComparison.OrdinalIgnoreCase)
                || pair.Key.EndsWith(nodeId, StringComparison.OrdinalIgnoreCase))
            {
                return seedCloudResourceIds.Contains(pair.Value);
            }
        }

        return false;
    }
}
