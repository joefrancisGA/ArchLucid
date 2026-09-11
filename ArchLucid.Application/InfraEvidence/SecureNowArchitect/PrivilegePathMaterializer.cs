using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PrivilegePathMaterializer
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
                InferenceSource = string.IsNullOrWhiteSpace(hop.InferenceSource)
                    ? MapInferenceSource(hop.EdgeType)
                    : hop.InferenceSource,
                EvidenceReference = $"snapshot:{snapshotId:D}:{hop.EdgeType}:{hop.FromNodeId}->{hop.ToNodeId}",
            });
        }

        return records;
    }

    private static PathConfidenceBand MapConfidenceBand(PrivilegePathEdge hop)
    {
        if (hop.EdgeType == "unknown-role-actions"
            || hop.InferenceSource == GraphEdgeInferenceSources.PimEligibilityUnknown)
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

    private static string MapInferenceSource(string edgeType) =>
        edgeType switch
        {
            GraphEdgeTypes.HasRole => GraphEdgeInferenceSources.InventoryRbacAssignment,
            GraphEdgeTypes.UsesIdentity => GraphEdgeInferenceSources.InventoryUsesIdentity,
            GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite => GraphEdgeInferenceSources.InventoryRbacDataPlaneMap,
            GraphEdgeTypes.CanAssume => GraphEdgeInferenceSources.InventoryUsesIdentity,
            GraphEdgeTypes.MemberOf => GraphEdgeInferenceSources.InventoryEntraGroupMembership,
            "unknown-role-actions" => GraphEdgeInferenceSources.InventoryRbacAssignment,
            _ => SecureNowArchitectConstants.SourceSystem,
        };
}
