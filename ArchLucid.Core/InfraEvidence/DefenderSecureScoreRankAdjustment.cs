namespace ArchLucid.Core.InfraEvidence;

public static class DefenderSecureScoreRankAdjustment
{
    public static decimal BlastRadiusPostureAdjustment(DefenderSecureScoreOrdinalBand band) =>
        band switch
        {
            DefenderSecureScoreOrdinalBand.Low => 0.5m,
            DefenderSecureScoreOrdinalBand.Medium => 0.25m,
            DefenderSecureScoreOrdinalBand.High => 0m,
            DefenderSecureScoreOrdinalBand.Unknown => 0m,
            _ => 0m,
        };

    public static string DescribeBlastRadiusPostureSource(DefenderSecureScoreOrdinalBand band) =>
        band switch
        {
            DefenderSecureScoreOrdinalBand.Low => "defender-posture-low",
            DefenderSecureScoreOrdinalBand.Medium => "defender-posture-medium",
            DefenderSecureScoreOrdinalBand.High => "defender-posture-high",
            DefenderSecureScoreOrdinalBand.Unknown => string.Empty,
            _ => string.Empty,
        };
}
