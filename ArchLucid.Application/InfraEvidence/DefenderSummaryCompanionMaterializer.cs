using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class DefenderSummaryCompanionMaterializer
{
    public static IReadOnlyList<AzureInventoryDefenderSummaryWrite> Materialize(
        IReadOnlyList<JsonElement> defenderSummary)
    {
        ArgumentNullException.ThrowIfNull(defenderSummary);

        if (defenderSummary.Count == 0)
        {
            return [];
        }

        List<AzureInventoryDefenderSummaryWrite> rows = [];

        foreach (JsonElement element in defenderSummary)
        {

            if (element.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            string? resourceId = TryReadString(element, "resourceId");

            if (string.IsNullOrWhiteSpace(resourceId))
            {
                continue;
            }

            if (!TryReadSecureScore(element, out int secureScore))
            {
                continue;
            }

            rows.Add(new AzureInventoryDefenderSummaryWrite
            {
                ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
                SecureScore = secureScore,
                SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DefenderSummary,
            });
        }

        return rows;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {

        if (!element.TryGetProperty(propertyName, out JsonElement property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String ? property.GetString() : null;
    }

    private static bool TryReadSecureScore(JsonElement element, out int secureScore)
    {
        secureScore = 0;

        if (!element.TryGetProperty("secureScore", out JsonElement property))
        {
            return false;
        }

        if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out int numericScore))
        {
            secureScore = numericScore;
            return true;
        }

        return false;
    }
}
