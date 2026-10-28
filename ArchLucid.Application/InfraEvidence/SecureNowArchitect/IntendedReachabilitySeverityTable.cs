using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>
///     Documented severity table for intended-reachability findings (SA-05).
/// </summary>
public static class IntendedReachabilitySeverityTable
{
    public static PrivilegePathSeverityResult Resolve(
        bool hasInsufficientEvidenceHop,
        bool scopeTaggedProduction)
    {
        if (hasInsufficientEvidenceHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        if (!scopeTaggedProduction)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        return new PrivilegePathSeverityResult
        {
            Severity = "High",
            BusinessCriticality = "Production",
            BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }
}
