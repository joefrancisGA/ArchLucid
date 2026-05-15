using System.Text.Json;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Lightweight payload inspection for <see cref="ComparisonReplayCostEstimator"/> — no replay execution.
/// </summary>
internal static class ComparisonReplayPayloadComplexity
{
    /// <summary>Returns a non-negative score bump (typically 0–12) from structured comparison JSON.</summary>
    public static int ScorePayloadComplexity(string payloadJson, ICollection<string> factors)
    {
        ArgumentNullException.ThrowIfNull(factors);

        if (string.IsNullOrWhiteSpace(payloadJson))
            return 0;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(payloadJson);
            JsonElement root = doc.RootElement;

            int bump = 0;

            if (TryCountCollection(root, "manifestDelta", out int manifestDeltaCount))
            {
                if (manifestDeltaCount > 80)
                {
                    bump += 4;
                    factors.Add($"Large manifest delta surface (~{manifestDeltaCount} entries) increases replay work.");
                }
                else if (manifestDeltaCount > 25)
                {
                    bump += 2;
                    factors.Add("Moderate manifest delta increases formatting and validation cost.");
                }
            }

            if (TryCountCollection(root, "decisionsDelta", out int decisionsDeltaCount) && decisionsDeltaCount > 15)
            {
                bump += 1;
                factors.Add("Many decision deltas contribute additional narrative diff cost.");
            }

            if (TryCountCollection(root, "tasks", out int tasksCount) && tasksCount > 12)
            {
                bump += 2;
                factors.Add("Stored comparison references many agent/task rows — expect heavier regeneration.");
            }

            if (TrySumNumericArray(root, "artifactSizesBytes", out long artifactBytes) && artifactBytes > 2_000_000)
            {
                bump += 2;
                factors.Add("Large referenced artifact payload sizes increase IO during regenerate/verify.");
            }

            return Math.Clamp(bump, 0, 12);
        }
        catch (JsonException)
        {
            factors.Add("Payload JSON is not structured — replay cost may vary at execution time.");
            return 1;
        }
    }

    private static bool TryCountCollection(JsonElement root, string propertyName, out int count)
    {
        count = 0;

        if (!root.TryGetProperty(propertyName, out JsonElement prop))
            return false;

        if (prop.ValueKind == JsonValueKind.Array)
        {
            count = prop.GetArrayLength();
            return true;
        }

        if (prop.ValueKind == JsonValueKind.Object)
        {
            int n = 0;

            foreach (JsonProperty _ in prop.EnumerateObject())

                n++;

            count = n;
            return true;
        }

        return false;
    }

    private static bool TrySumNumericArray(JsonElement root, string propertyName, out long sum)
    {
        sum = 0;

        if (!root.TryGetProperty(propertyName, out JsonElement arr) || arr.ValueKind != JsonValueKind.Array ||
            arr.GetArrayLength() == 0)
            return false;

        foreach (JsonElement item in arr.EnumerateArray())
        {
            if (item.TryGetInt64(out long v))

                sum += v;

            else if (item.TryGetDouble(out double d))

                sum += (long)d;
        }

        return true;
    }
}
