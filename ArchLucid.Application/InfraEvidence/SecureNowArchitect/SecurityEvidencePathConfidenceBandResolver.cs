using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecurityEvidencePathConfidenceBandResolver
{
    public static PathConfidenceBand ResolveWeakestHopBand(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        if (hops.Count == 0)
        {
            return PathConfidenceBand.Possible;
        }

        PathConfidenceBand weakest = PathConfidenceBand.Confirmed;

        foreach (SecurityEvidencePathHopRecord hop in hops)
        {
            if ((int)hop.HopConfidenceBand < (int)weakest)
            {
                weakest = hop.HopConfidenceBand;
            }
        }

        return weakest;
    }
}
