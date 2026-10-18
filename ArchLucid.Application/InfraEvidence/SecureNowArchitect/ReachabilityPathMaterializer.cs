using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ReachabilityPathMaterializer
{
    public static IReadOnlyList<SecurityEvidencePathHopRecord> BuildHopRecords(
        Guid tenantId,
        Guid pathId,
        Guid snapshotId,
        IReadOnlyList<PrivilegePathEdge> hops)
    {
        List<SecurityEvidencePathHopRecord> records = [];

        for (int index = 0; index < hops.Count; index++)
        {
            PrivilegePathEdge hop = hops[index];

            records.Add(new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = pathId,
                TenantId = tenantId,
                HopOrdinal = index + 1,
                FromNodeId = hop.FromNodeId,
                ToNodeId = hop.ToNodeId,
                EdgeType = hop.EdgeType,
                ProvenanceKind = hop.ProvenanceKind,
                HopConfidenceBand = MapConfidenceBand(hop),
                InferenceSource = MapInferenceSource(hop),
                EvidenceReference = $"snapshot:{snapshotId:D}:{hop.EdgeType}:{hop.FromNodeId}->{hop.ToNodeId}",
            });
        }

        return records;
    }

    private static PathConfidenceBand MapConfidenceBand(PrivilegePathEdge hop)
    {
        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType
            || hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType
            || hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType
            || hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType)
        {
            return PathConfidenceBand.InsufficientEvidence;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.NetworkEdgeControlAllowedHopEdgeType)
        {
            return PathConfidenceBand.Probable;
        }

        if (hop.ProvenanceKind == ProvenanceKind.ObservedFact)
        {
            return PathConfidenceBand.Confirmed;
        }

        if (hop.EdgeType == GraphEdgeTypes.RoutesTo
            && hop.ProvenanceKind == ProvenanceKind.DeterministicInference)
        {
            return PathConfidenceBand.HighlyLikely;
        }

        if (hop.ProvenanceKind == ProvenanceKind.DerivedFact)
        {
            return PathConfidenceBand.Probable;
        }

        return PathConfidenceBand.Possible;
    }

    private static string MapInferenceSource(PrivilegePathEdge hop)
    {
        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType)
        {
            return SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType)
        {
            return SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType)
        {
            return SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType)
        {
            return SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.NetworkEdgeControlAllowedHopEdgeType)
        {
            return SecureNowArchitectConstants.NetworkEdgeControlAllowedHopEdgeType;
        }

        if (hop.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget)
        {
            return GraphEdgeInferenceSources.InventoryPeReachableTarget;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType)
        {
            return GraphEdgeInferenceSources.InventoryPublicIp;
        }

        return hop.EdgeType switch
        {
            GraphEdgeTypes.Exposes => GraphEdgeInferenceSources.InventoryPublicIp,
            GraphEdgeTypes.RoutesTo => GraphEdgeInferenceSources.InventoryNsgAllowRule,
            GraphEdgeTypes.ConnectsTo => GraphEdgeInferenceSources.InventoryNicSubnet,
            GraphEdgeTypes.Contains => GraphEdgeInferenceSources.InventoryExplicitParentChild,
            _ => SecureNowArchitectConstants.SourceSystem,
        };
    }
}
