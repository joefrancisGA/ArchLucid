using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationSeverityTable
{
    public static PrivilegePathSeverityResult Resolve(ToxicCombinationCandidate candidate)
    {
        if (candidate.HasInsufficientEvidenceHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "High",
                BusinessCriticality = "Unknown",
                BlastRadius = "Combined",
            };
        }

        if (candidate.HasDataPlaneWriteHop && candidate.HasEgressHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "Critical",
                BusinessCriticality = "Unknown",
                BlastRadius = "Combined",
            };
        }

        if (candidate.HasDataPlaneWriteHop || candidate.HasEgressHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "High",
                BusinessCriticality = "Unknown",
                BlastRadius = "Combined",
            };
        }

        return new PrivilegePathSeverityResult
        {
            Severity = "High",
            BusinessCriticality = "Unknown",
            BlastRadius = "Combined",
        };
    }
}
