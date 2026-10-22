using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

/// <summary>Maps pilot-run-deltas JSON to <see cref="RoiMetricSourceFreshnessRules" />.</summary>
internal static class PilotProofPacketRoiFreshnessEvaluator
{
    internal static string ResolveDisposition(string deltasJson, DateTime utcNow)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        return RoiMetricSourceFreshnessRules.ResolveDisposition(
            TryReadExtractorTimestamp(root),
            root.TryGetProperty("isDemoTenant", out JsonElement demoEl) && demoEl.ValueKind == JsonValueKind.True,
            TryReadEstimatedSavings(root),
            PilotProofPacketRoiArtifacts.TryParseRoiMetricSources(deltasJson),
            utcNow);
    }

    internal static string BuildLimitationsLine(string deltasJson, DateTime utcNow)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        return RoiMetricSourceFreshnessRules.BuildLimitationsLine(
            TryReadExtractorTimestamp(root),
            root.TryGetProperty("isDemoTenant", out JsonElement demoEl) && demoEl.ValueKind == JsonValueKind.True,
            TryReadEstimatedSavings(root),
            PilotProofPacketRoiArtifacts.TryParseRoiMetricSources(deltasJson),
            utcNow);
    }

    private static DateTime? TryReadExtractorTimestamp(JsonElement root)
    {
        if (!root.TryGetProperty("extractorCollectionTimestampUtc", out JsonElement tsEl)
            || tsEl.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        if (!DateTime.TryParse(tsEl.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime collected))
            return null;

        return collected.Kind == DateTimeKind.Utc ? collected : collected.ToUniversalTime();
    }

    private static decimal? TryReadEstimatedSavings(JsonElement root)
    {
        if (!root.TryGetProperty("estimatedUsdSavings", out JsonElement savingsEl)
            || savingsEl.ValueKind != JsonValueKind.Number
            || !savingsEl.TryGetDecimal(out decimal savings))
        {
            return null;
        }

        return savings;
    }
}
