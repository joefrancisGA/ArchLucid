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
                Severity = "Medium",
                BusinessCriticality = "Unknown",
                BlastRadius = "Unknown",
            };
        }

        return new PrivilegePathSeverityResult
        {
            Severity = scopeTaggedProduction ? "High" : "Medium",
            BusinessCriticality = scopeTaggedProduction ? "Production" : "Unknown",
            BlastRadius = "Standard",
        };
    }
}
