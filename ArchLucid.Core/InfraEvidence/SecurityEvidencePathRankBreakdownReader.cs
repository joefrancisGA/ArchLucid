using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidencePathRankBreakdownReader
{
    public static string? TryReadDefenderPostureBandLabel(string? breakdownJson)
    {

        if (string.IsNullOrWhiteSpace(breakdownJson))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(breakdownJson);

            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            foreach (JsonElement entry in document.RootElement.EnumerateArray())
            {

                if (entry.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                if (!entry.TryGetProperty("dimension", out JsonElement dimensionProperty)
                    || dimensionProperty.ValueKind != JsonValueKind.String)
                {
                    continue;
                }

                string? dimension = dimensionProperty.GetString();

                if (!string.Equals(
                        dimension,
                        SecurityEvidencePathRankDimension.BlastRadius.ToString(),
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!entry.TryGetProperty("source", out JsonElement sourceProperty)
                    || sourceProperty.ValueKind != JsonValueKind.String)
                {
                    return null;
                }

                return DefenderSecureScoreRankAdjustment.TryReadOrdinalBandLabelFromBlastRadiusSource(
                    sourceProperty.GetString());
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }
}
