using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationPathMaterializer
{
    public static IReadOnlyList<SecurityEvidencePathHopRecord> RenumberForPath(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathHopRecord> sourceHops)
    {
        ArgumentNullException.ThrowIfNull(sourceHops);

        List<SecurityEvidencePathHopRecord> records = [];

        for (int index = 0; index < sourceHops.Count; index++)
        {
            SecurityEvidencePathHopRecord hop = sourceHops[index];

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
                HopConfidenceBand = hop.HopConfidenceBand,
                InferenceSource = hop.InferenceSource,
                EvidenceReference = hop.EvidenceReference,
                CloudResourceId = hop.CloudResourceId,
            });
        }

        return records;
    }
}
