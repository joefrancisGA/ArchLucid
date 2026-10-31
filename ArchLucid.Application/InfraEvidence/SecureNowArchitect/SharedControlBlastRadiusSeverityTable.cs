namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusSeverityTable
{
    internal const string HighBandFromDependentCountCopy =
        "High severity band is assigned when dependent count is 10 or more.";

    internal const string BelowHighBandNotRaisedCopy =
        "Severity was not raised by the dependent-count table (fewer than 10 dependents).";

    public static PrivilegePathSeverityResult Resolve(SharedControlBlastRadiusCandidate candidate)
    {
        string severity = candidate.DependentCount >= 10 ? HighBandFromDependentCountCopy : BelowHighBandNotRaisedCopy;

        return new PrivilegePathSeverityResult
        {
            Severity = severity,
            BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
            BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }
}
