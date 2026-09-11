using System.Security.Cryptography;
using System.Text;

using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidencePathCanonicalHash
{
    public static byte[] ComputeSha256(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(hops);

        if (hops.Count == 0)
        {
            throw new ArgumentException("At least one hop is required.", nameof(hops));
        }

        IEnumerable<SecurityEvidencePathHopRecord> ordered = hops
            .OrderBy(static hop => hop.HopOrdinal)
            .ThenBy(static hop => hop.FromNodeId, StringComparer.Ordinal)
            .ThenBy(static hop => hop.ToNodeId, StringComparer.Ordinal);

        StringBuilder builder = new();
        foreach (SecurityEvidencePathHopRecord hop in ordered)
        {
            builder.Append(hop.HopOrdinal);
            builder.Append('|');
            builder.Append(hop.FromNodeId);
            builder.Append('|');
            builder.Append(hop.ToNodeId);
            builder.Append('|');
            builder.Append(hop.EdgeType);
            builder.Append('|');
            builder.Append((int)hop.ProvenanceKind);
            builder.Append('|');
            builder.Append((int)hop.HopConfidenceBand);
            builder.Append('|');
            builder.Append(hop.InferenceSource ?? string.Empty);
            builder.Append('|');
            builder.Append(hop.EvidenceReference);
            builder.Append('\n');
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
    }
}
