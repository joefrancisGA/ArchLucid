using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class FourRealityDriftMaterializer
{
    public static IReadOnlyList<SecurityEvidencePathHopRecord> BuildHopRecords(
        Guid tenantId,
        Guid pathId,
        Guid snapshotId,
        FourRealityDriftCandidate candidate)
    {
        List<SecurityEvidencePathHopRecord> records = [];
        int ordinal = 1;

        foreach (SecurityEvidencePathHopRecord sourceHop in candidate.SourceHops)
        {
            records.Add(new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = pathId,
                TenantId = tenantId,
                HopOrdinal = ordinal++,
                FromNodeId = sourceHop.FromNodeId,
                ToNodeId = sourceHop.ToNodeId,
                EdgeType = sourceHop.EdgeType,
                ProvenanceKind = sourceHop.ProvenanceKind,
                HopConfidenceBand = sourceHop.HopConfidenceBand,
                InferenceSource = sourceHop.InferenceSource,
                EvidenceReference = sourceHop.EvidenceReference,
                CloudResourceId = sourceHop.CloudResourceId ?? candidate.CloudResourceId,
            });
        }

        records.Add(new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = tenantId,
            HopOrdinal = ordinal,
            FromNodeId = candidate.AzureResourceId,
            ToNodeId = SecureNowArchitectConstants.FourRealityDriftTerminalNodeId,
            EdgeType = SecureNowArchitectConstants.FourRealityDriftHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = BuildDriftEvidenceReference(snapshotId, candidate),
            CloudResourceId = candidate.CloudResourceId,
        });

        return records;
    }

    private static string BuildDriftEvidenceReference(Guid snapshotId, FourRealityDriftCandidate candidate)
    {
        string changeToken = candidate.RelatedChangeId?.ToString("D") ?? "none";

        return $"snapshot:{snapshotId:D}:four-reality-drift:{candidate.CloudResourceId:D}:change:{changeToken}";
    }
}
