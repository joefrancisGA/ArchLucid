namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusSeverityTable
{
    public static PrivilegePathSeverityResult Resolve(SharedControlBlastRadiusCandidate candidate)
    {
        string severity = candidate.DependentCount >= 10
            ? "High"
            : candidate.DependentCount >= 5
                ? "Medium"
                : "Medium";

        return new PrivilegePathSeverityResult
        {
            Severity = severity,
            BusinessCriticality = "Unknown",
            BlastRadius = candidate.DependentCount.ToString(),
        };
    }
}
