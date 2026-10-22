namespace ArchLucid.Core.InfraEvidence;

/// <summary>SA-11 architecture-outcome metrics rule version.</summary>
public static class SecureNowArchitectMetricsConstants
{
    public const string RuleVersion = "SA11-metrics-v1";

    public static bool IsCriticalOrHighConfidence(PathConfidenceBand band) =>
        band is PathConfidenceBand.Confirmed or PathConfidenceBand.HighlyLikely;
}
