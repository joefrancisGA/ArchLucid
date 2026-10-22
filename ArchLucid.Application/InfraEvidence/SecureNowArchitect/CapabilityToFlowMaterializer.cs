using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowMaterializer
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
        if (hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType)
        {
            return PathConfidenceBand.Possible;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType)
        {
            return PathConfidenceBand.InsufficientEvidence;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType)
        {
            return hop.ProvenanceKind == ProvenanceKind.ObservedFact
                ? PathConfidenceBand.Confirmed
                : PathConfidenceBand.Possible;
        }

        if (hop.EdgeType == "unknown-role-actions")
        {
            return PathConfidenceBand.InsufficientEvidence;
        }

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
        if (hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType)
        {
            return SecureNowArchitectConstants.PossibleMovementHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType)
        {
            return SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType;
        }

        if (hop.EdgeType == SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType)
        {
            return SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType;
        }

        return hop.EdgeType switch
        {
            GraphEdgeTypes.HasRole => GraphEdgeInferenceSources.InventoryRbacAssignment,
            GraphEdgeTypes.UsesIdentity => GraphEdgeInferenceSources.InventoryUsesIdentity,
            GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite => GraphEdgeInferenceSources.InventoryRbacDataPlaneMap,
            GraphEdgeTypes.CanAssume => GraphEdgeInferenceSources.InventoryUsesIdentity,
            _ => SecureNowArchitectConstants.SourceSystem,
        };
    }
}
