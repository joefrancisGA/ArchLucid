using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowEnumerator
{
    public static IReadOnlyList<CapabilityToFlowCandidate> Enumerate(
        AzureInventorySnapshotDetailReadModel snapshot,
        PrivilegePathEngineOptions options)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(options);

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> privilegePaths = PrivilegePathEnumerator.Enumerate(graph, options);
        IReadOnlyDictionary<string, PrivilegePathEdge> egressBySubnetArmId =
            ToxicCombinationEgressDetector.DetectUnrestrictedEgressBySubnet(snapshot);

        List<CapabilityToFlowCandidate> results = [];
        HashSet<string> seenSignatures = new(StringComparer.Ordinal);

        foreach (PrivilegePathCandidate privilegePath in privilegePaths)
        {
            if (!Qualifies(privilegePath))
            {
                continue;
            }

            List<PrivilegePathEdge> hops = [.. privilegePath.Hops];
            hops.Add(new PrivilegePathEdge
            {
                FromNodeId = privilegePath.TerminalScopeNodeId,
                ToNodeId = privilegePath.TerminalScopeNodeId,
                EdgeType = SecureNowArchitectConstants.PossibleMovementHopEdgeType,
                ProvenanceKind = ProvenanceKind.DeterministicInference,
                RoleName = privilegePath.EffectiveRoleName,
            });

            bool hasUnrestrictedEgress = false;
            string? subnetArmId = CapabilityToFlowWorkloadSubnetResolver.TryResolveSubnetArmId(snapshot, hops);

            if (subnetArmId is not null
                && egressBySubnetArmId.TryGetValue(subnetArmId, out PrivilegePathEdge? egressEdge)
                && egressEdge is not null)
            {
                hops.Add(egressEdge);
                hasUnrestrictedEgress = true;
            }
            else
            {
                hops.Add(new PrivilegePathEdge
                {
                    FromNodeId = subnetArmId ?? privilegePath.TerminalScopeNodeId,
                    ToNodeId = SecureNowArchitectConstants.InternetEgressNodeId,
                    EdgeType = SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                    RoleName = null,
                });
            }

            string signature = BuildSignature(hops);

            if (!seenSignatures.Add(signature))
            {
                continue;
            }

            results.Add(new CapabilityToFlowCandidate
            {
                Hops = hops,
                WorkloadIdentityNodeId = ResolveWorkloadIdentityNodeId(privilegePath.Hops),
                DataAssetNodeId = privilegePath.TerminalScopeNodeId,
                HasInsufficientEvidenceHop = !hasUnrestrictedEgress
                                            || privilegePath.HasInsufficientEvidenceHop,
                HasUnrestrictedEgressHop = hasUnrestrictedEgress,
                TerminalCloudResourceId = privilegePath.TerminalCloudResourceId,
                TerminalResourceType = privilegePath.TerminalResourceType,
                EffectiveRoleName = privilegePath.EffectiveRoleName,
            });
        }

        return results;
    }

    private static bool Qualifies(PrivilegePathCandidate privilegePath)
    {
        if (!CapabilityToFlowAssetClassifier.IsDataBearingAsset(privilegePath.TerminalResourceType))
        {
            return false;
        }

        if (!privilegePath.Hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity))
        {
            return false;
        }

        return privilegePath.Hops.Any(static hop =>
            hop.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);
    }

    private static string ResolveWorkloadIdentityNodeId(IReadOnlyList<PrivilegePathEdge> hops)
    {
        PrivilegePathEdge? usesIdentityHop = hops.FirstOrDefault(static hop =>
            hop.EdgeType == GraphEdgeTypes.UsesIdentity);

        if (usesIdentityHop is not null)
        {
            return usesIdentityHop.ToNodeId;
        }

        return hops[0].FromNodeId;
    }

    private static string BuildSignature(IReadOnlyList<PrivilegePathEdge> hops) =>
        string.Join(
            ">",
            hops.Select(static hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"));
}
