namespace ArchLucid.Core.InfraEvidence;

public static class DefenderSecureScoreOrdinalBandMapper
{
    public static DefenderSecureScoreOrdinalBand FromSecureScorePercent(int secureScorePercent)
    {

        if (secureScorePercent < 0 || secureScorePercent > 100)
        {
            return DefenderSecureScoreOrdinalBand.Unknown;
        }

        if (secureScorePercent < 40)
        {
            return DefenderSecureScoreOrdinalBand.Low;
        }

        if (secureScorePercent < 70)
        {
            return DefenderSecureScoreOrdinalBand.Medium;
        }

        return DefenderSecureScoreOrdinalBand.High;
    }

    public static string ToMetadataValue(DefenderSecureScoreOrdinalBand band) =>
        band switch
        {
            DefenderSecureScoreOrdinalBand.Low => "Low",
            DefenderSecureScoreOrdinalBand.Medium => "Medium",
            DefenderSecureScoreOrdinalBand.High => "High",
            DefenderSecureScoreOrdinalBand.Unknown => "Unknown",
            _ => "Unknown",
        };
}
