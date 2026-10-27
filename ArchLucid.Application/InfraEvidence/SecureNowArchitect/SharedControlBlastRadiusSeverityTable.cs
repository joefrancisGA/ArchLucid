namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusSeverityTable
{
    public static PrivilegePathSeverityResult Resolve(SharedControlBlastRadiusCandidate candidate)
    {
        string severity = candidate.DependentCount >= 10 ? "High" : string.Empty;

        return new PrivilegePathSeverityResult
        {
            Severity = severity,
            BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
            BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }
}
