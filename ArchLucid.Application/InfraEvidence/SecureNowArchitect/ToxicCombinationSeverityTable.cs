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
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        if (candidate.HasDataPlaneWriteHop && candidate.HasEgressHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "Critical",
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = "Combined",
            };
        }

        if (candidate.HasDataPlaneWriteHop || candidate.HasEgressHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "High",
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = "Combined",
            };
        }

        return new PrivilegePathSeverityResult
        {
            Severity = string.Empty,
            BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
            BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }
}
