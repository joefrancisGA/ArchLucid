using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusMaterializer
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
                EvidenceReference = BuildEvidenceReference(snapshotId, hop),
            });
        }

        return records;
    }

    private static PathConfidenceBand MapConfidenceBand(PrivilegePathEdge hop)
    {
        if (hop.ProvenanceKind == ProvenanceKind.ObservedFact)
        {
            return PathConfidenceBand.Confirmed;
        }

        if (hop.ProvenanceKind == ProvenanceKind.DerivedFact)
        {
            return PathConfidenceBand.Probable;
        }

        return PathConfidenceBand.Possible;
    }

    private static string MapInferenceSource(PrivilegePathEdge hop)
    {
        if (hop.EdgeType == SecureNowArchitectConstants.SharedControlFanOutHopEdgeType)
        {
            return SecureNowArchitectConstants.SharedControlFanOutHopEdgeType;
        }

        return hop.EdgeType switch
        {
            GraphEdgeTypes.AppliesTo => GraphEdgeInferenceSources.InventoryPolicyAssignment,
            GraphEdgeTypes.HasRole => GraphEdgeInferenceSources.InventoryRbacAssignment,
            GraphEdgeTypes.UsesIdentity => GraphEdgeInferenceSources.InventoryUsesIdentity,
            _ => SecureNowArchitectConstants.SourceSystem,
        };
    }

    private static string BuildEvidenceReference(Guid snapshotId, PrivilegePathEdge hop)
    {
        if (hop.EdgeType == SecureNowArchitectConstants.SharedControlFanOutHopEdgeType)
        {
            return $"snapshot:{snapshotId:D}:{hop.RoleName}:{hop.FromNodeId}->{hop.ToNodeId}";
        }

        return $"snapshot:{snapshotId:D}:{hop.EdgeType}:{hop.FromNodeId}->{hop.ToNodeId}";
    }
}
