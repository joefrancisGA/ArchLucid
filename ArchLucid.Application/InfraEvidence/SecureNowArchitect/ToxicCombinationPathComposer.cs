using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationPathComposer
{
    public static IReadOnlyList<ToxicCombinationCandidate> Compose(
        IReadOnlyList<ToxicCombinationPathSnapshot> reachabilityPaths,
        IReadOnlyList<ToxicCombinationPathSnapshot> privilegePaths,
        IReadOnlyDictionary<string, PrivilegePathEdge> egressBySubnetArmId)
    {
        ArgumentNullException.ThrowIfNull(reachabilityPaths);
        ArgumentNullException.ThrowIfNull(privilegePaths);
        ArgumentNullException.ThrowIfNull(egressBySubnetArmId);

        if (reachabilityPaths.Count == 0 || privilegePaths.Count == 0)
        {
            return [];
        }

        Dictionary<string, ToxicCombinationCandidate> bestByReachabilityAsset = new(StringComparer.Ordinal);

        foreach (ToxicCombinationPathSnapshot reachabilityPath in reachabilityPaths)
        {
            foreach (ToxicCombinationPathSnapshot privilegePath in privilegePaths)
            {
                if (!TryResolveSharedAsset(reachabilityPath, privilegePath, out string sharedAssetNodeId))
                {
                    continue;
                }

                PrivilegePathEdge? egressEdge = null;
                string? subnetArmId = ToxicCombinationEgressDetector.TryFindSubnetArmId(reachabilityPath.Hops);

                if (subnetArmId is not null
                    && egressBySubnetArmId.TryGetValue(subnetArmId, out PrivilegePathEdge? edge)
                    && edge is not null)
                {
                    egressEdge = edge;
                }

                IReadOnlyList<SecurityEvidencePathHopRecord> mergedHops = MergeHops(
                    reachabilityPath.Hops,
                    privilegePath.Hops,
                    egressEdge);

                ToxicCombinationCandidate candidate = new()
                {
                    Hops = mergedHops,
                    ReachabilityPathId = reachabilityPath.Path.PathId,
                    PrivilegePathId = privilegePath.Path.PathId,
                    SharedAssetNodeId = sharedAssetNodeId,
                    ReachabilityStartNodeId = reachabilityPath.Hops[0].FromNodeId,
                    PrivilegeIdentityNodeId = ResolveIdentityNodeId(privilegePath.Hops),
                    HasEgressHop = egressEdge is not null,
                    HasInsufficientEvidenceHop = mergedHops.Any(static hop =>
                        hop.HopConfidenceBand == PathConfidenceBand.InsufficientEvidence),
                    TerminalCloudResourceId = reachabilityPath.TerminalCloudResourceId
                                                ?? privilegePath.TerminalCloudResourceId,
                    TerminalResourceType = reachabilityPath.TerminalResourceType
                                           ?? privilegePath.TerminalResourceType,
                    HasDataPlaneWriteHop = mergedHops.Any(static hop =>
                        hop.EdgeType == GraphEdgeTypes.CanWrite),
                };

                string selectionKey =
                    $"{reachabilityPath.Path.PathId:D}|{sharedAssetNodeId}|{candidate.HasEgressHop}";

                if (bestByReachabilityAsset.TryGetValue(selectionKey, out ToxicCombinationCandidate? existing)
                    && ScoreCandidate(existing) >= ScoreCandidate(candidate))
                {
                    continue;
                }

                bestByReachabilityAsset[selectionKey] = candidate;
            }
        }

        HashSet<string> seenHopHashes = new(StringComparer.Ordinal);
        List<ToxicCombinationCandidate> results = [];

        foreach (ToxicCombinationCandidate candidate in bestByReachabilityAsset.Values)
        {
            string hopHash = Convert.ToHexStringLower(
                SecurityEvidencePathCanonicalHash.ComputeSha256(candidate.Hops));

            if (!seenHopHashes.Add(hopHash))
            {
                continue;
            }

            results.Add(candidate);
        }

        return results
            .OrderByDescending(static candidate => candidate.HasDataPlaneWriteHop)
            .ThenByDescending(static candidate => candidate.HasEgressHop)
            .ThenBy(static candidate => candidate.SharedAssetNodeId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static int ScoreCandidate(ToxicCombinationCandidate candidate)
    {
        int score = 0;

        if (candidate.Hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity))
        {
            score += 4;
        }

        if (candidate.HasDataPlaneWriteHop)
        {
            score += 3;
        }

        if (candidate.HasEgressHop)
        {
            score += 2;
        }

        score += candidate.Hops.Count;

        return score;
    }

    private static bool TryResolveSharedAsset(
        ToxicCombinationPathSnapshot reachabilityPath,
        ToxicCombinationPathSnapshot privilegePath,
        out string sharedAssetNodeId)
    {
        if (reachabilityPath.NodeIds.Overlaps(privilegePath.NodeIds))
        {
            sharedAssetNodeId = reachabilityPath.TerminalNodeId;

            if (privilegePath.NodeIds.Contains(reachabilityPath.TerminalNodeId))
            {
                return true;
            }

            sharedAssetNodeId = privilegePath.TerminalNodeId;

            if (reachabilityPath.NodeIds.Contains(privilegePath.TerminalNodeId))
            {
                return true;
            }

            sharedAssetNodeId = reachabilityPath.NodeIds
                .Intersect(privilegePath.NodeIds, StringComparer.OrdinalIgnoreCase)
                .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase)
                .First();

            return true;
        }

        if (reachabilityPath.TerminalCloudResourceId.HasValue
            && reachabilityPath.TerminalCloudResourceId == privilegePath.TerminalCloudResourceId)
        {
            sharedAssetNodeId = reachabilityPath.TerminalNodeId;

            return true;
        }

        sharedAssetNodeId = string.Empty;

        return false;
    }

    private static IReadOnlyList<SecurityEvidencePathHopRecord> MergeHops(
        IReadOnlyList<SecurityEvidencePathHopRecord> reachabilityHops,
        IReadOnlyList<SecurityEvidencePathHopRecord> privilegeHops,
        PrivilegePathEdge? egressEdge)
    {
        List<SecurityEvidencePathHopRecord> merged = [.. reachabilityHops];

        int privilegeStartIndex = 0;

        if (privilegeHops.Count > 0
            && reachabilityHops.Count > 0
            && string.Equals(
                reachabilityHops[^1].ToNodeId,
                privilegeHops[0].FromNodeId,
                StringComparison.OrdinalIgnoreCase))
        {
            privilegeStartIndex = 1;
        }

        for (int index = privilegeStartIndex; index < privilegeHops.Count; index++)
        {
            merged.Add(privilegeHops[index]);
        }

        if (egressEdge is not null)
        {
            merged.Add(BuildEgressHopRecord(egressEdge));
        }

        return merged;
    }

    private static SecurityEvidencePathHopRecord BuildEgressHopRecord(PrivilegePathEdge egressEdge) =>
        new()
        {
            HopRowId = Guid.Empty,
            PathId = Guid.Empty,
            TenantId = Guid.Empty,
            HopOrdinal = 0,
            FromNodeId = egressEdge.FromNodeId,
            ToNodeId = egressEdge.ToNodeId,
            EdgeType = egressEdge.EdgeType,
            ProvenanceKind = egressEdge.ProvenanceKind,
            HopConfidenceBand = egressEdge.ProvenanceKind == ProvenanceKind.ObservedFact
                ? PathConfidenceBand.Confirmed
                : PathConfidenceBand.Possible,
            InferenceSource = SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType,
            EvidenceReference = $"{SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType}:{egressEdge.FromNodeId}->{egressEdge.ToNodeId}",
        };

    private static string ResolveIdentityNodeId(IReadOnlyList<SecurityEvidencePathHopRecord> privilegeHops)
    {
        SecurityEvidencePathHopRecord? identityHop = privilegeHops.FirstOrDefault(static hop =>
            hop.EdgeType == GraphEdgeTypes.UsesIdentity
            || hop.FromNodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal));

        if (identityHop is null)
        {
            return privilegeHops[0].FromNodeId;
        }

        return identityHop.EdgeType == GraphEdgeTypes.UsesIdentity
            ? identityHop.ToNodeId
            : identityHop.FromNodeId;
    }
}
