using System.Text.Json;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Lightweight payload inspection for <see cref="ComparisonReplayCostEstimator"/> — no replay execution.
/// </summary>
internal static class ComparisonReplayPayloadComplexity
{
    /// <summary>Caps heuristic bump from JSON inspection (format/replay-mode scoring is separate).</summary>
    private const int MaxPayloadBump = 18;

    private static readonly string[] ManifestDiffListProperties =
    [
        "addedServices",
        "removedServices",
        "addedDatastores",
        "removedDatastores",
        "addedRequiredControls",
        "removedRequiredControls",
        "addedRelationships",
        "removedRelationships"
    ];

    private static readonly string[] AgentDeltaListProperties =
    [
        "addedClaims",
        "removedClaims",
        "addedEvidenceRefs",
        "removedEvidenceRefs",
        "addedFindings",
        "removedFindings",
        "addedRequiredControls",
        "removedRequiredControls",
        "addedWarnings",
        "removedWarnings"
    ];

    /// <summary>Returns a non-negative score bump (typically 0–18) from structured comparison JSON.</summary>
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

            if (root.ValueKind == JsonValueKind.Object && LooksLikeEndToEndReport(root))
                bump += ScoreEndToEndReportShape(root, factors);
            else if (root.ValueKind == JsonValueKind.Object && LooksLikeExportRecordDiff(root))
                bump += ScoreExportRecordDiffShape(root, factors);

            if (ShouldScoreLegacyManifestDelta(root))
            {
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
            else if (TrySumNumericArray(root, "artifactSizesBytes", out artifactBytes) && artifactBytes > 500_000)
            {
                bump += 1;
                factors.Add("Moderate referenced artifact sizes increase IO during regenerate/verify.");
            }

            return Math.Clamp(bump, 0, MaxPayloadBump);
        }
        catch (JsonException)
        {
            factors.Add("Payload JSON is not structured — replay cost may vary at execution time.");
            return 1;
        }
    }

    private static bool LooksLikeEndToEndReport(JsonElement root) =>
        root.TryGetProperty("runDiff", out _) || root.TryGetProperty("manifestDiff", out _) ||
        root.TryGetProperty("agentResultDiff", out _) || root.TryGetProperty("exportDiffs", out _) ||
        root.TryGetProperty("interpretationNotes", out _);

    private static bool LooksLikeExportRecordDiff(JsonElement root) =>
        root.TryGetProperty("changedTopLevelFields", out _) && root.TryGetProperty("requestDiff", out _);

    private static bool ShouldScoreLegacyManifestDelta(JsonElement root) =>
        !root.TryGetProperty("manifestDiff", out _);

    private static int ScoreEndToEndReportShape(JsonElement root, ICollection<string> factors)
    {
        int bump = 0;

        if (root.TryGetProperty("manifestDiff", out JsonElement manifestDiff) &&
            manifestDiff.ValueKind == JsonValueKind.Object)
        {
            int structural = SumListLengths(manifestDiff, ManifestDiffListProperties);

            if (structural > 60)
            {
                bump += 6;
                factors.Add(
                    $"Large manifest structural diff (~{structural} added/removed items and relationships) increases replay and formatting work.");
            }
            else if (structural > 30)
            {
                bump += 4;
                factors.Add("Substantial manifest structural diff increases replay and formatting work.");
            }
            else if (structural > 12)
            {
                bump += 2;
                factors.Add("Moderate manifest structural diff adds validation and narrative cost.");
            }
            else if (structural > 0)
            {
                bump += 1;
                factors.Add("Manifest includes structural changes (services, datastores, controls, or relationships).");
            }
        }

        if (root.TryGetProperty("agentResultDiff", out JsonElement agentResultDiff) &&
            agentResultDiff.ValueKind == JsonValueKind.Object &&
            agentResultDiff.TryGetProperty("agentDeltas", out JsonElement deltas) &&
            deltas.ValueKind == JsonValueKind.Array)
        {
            int agentTypes = deltas.GetArrayLength();
            int perAgentSurface = 0;

            foreach (JsonElement delta in deltas.EnumerateArray())
            {
                if (delta.ValueKind == JsonValueKind.Object)
                    perAgentSurface += SumListLengths(delta, AgentDeltaListProperties);
            }

            int substantiveAgents = 0;

            foreach (JsonElement delta in deltas.EnumerateArray())
            {
                if (delta.ValueKind != JsonValueKind.Object)
                    continue;

                if (SumListLengths(delta, AgentDeltaListProperties) > 0 || DeltaIndicatesPresenceChange(delta))
                    substantiveAgents++;
            }

            if (agentTypes > 10 || substantiveAgents > 8 || perAgentSurface > 120)
            {
                bump += 4;
                factors.Add(
                    $"Heavy agent result surface ({agentTypes} agent type(s), ~{perAgentSurface} line-item deltas) increases regeneration and verify cost.");
            }
            else if (agentTypes > 5 || substantiveAgents > 4 || perAgentSurface > 50)
            {
                bump += 2;
                factors.Add("Multiple agent types or substantive per-agent deltas increase comparison work.");
            }
            else if (agentTypes > 0 && (perAgentSurface > 0 || substantiveAgents > 0))
            {
                bump += 1;
                factors.Add("Agent result deltas present — expect extra narrative and diff formatting.");
            }
        }

        if (root.TryGetProperty("exportDiffs", out JsonElement exportDiffs) && exportDiffs.ValueKind == JsonValueKind.Array)
        {
            int n = exportDiffs.GetArrayLength();

            if (n > 8)
            {
                bump += 3;
                factors.Add($"Many paired export record diffs ({n}) — replay touches multiple export comparisons.");
            }
            else if (n > 3)
            {
                bump += 2;
                factors.Add($"Several export record diffs ({n}) add export pipeline work to replay.");
            }
            else if (n > 0)
            {
                bump += 1;
                factors.Add("Export record diffs included — extra export sections in formatted output.");
            }
        }

        if (root.TryGetProperty("runDiff", out JsonElement runDiff) && runDiff.ValueKind == JsonValueKind.Object &&
            runDiff.TryGetProperty("changedFields", out JsonElement changedFields) &&
            changedFields.ValueKind == JsonValueKind.Array)
        {
            int n = changedFields.GetArrayLength();

            if (n > 12)
            {
                bump += 2;
                factors.Add("Run metadata differs across many fields — broader regeneration and narrative scope.");
            }
            else if (n > 5)
            {
                bump += 1;
                factors.Add("Run metadata includes several changed fields versus a tight metadata diff.");
            }
        }

        return bump;
    }

    private static bool DeltaIndicatesPresenceChange(JsonElement delta)
    {
        if (delta.TryGetProperty("leftExists", out JsonElement left) &&
            left.ValueKind is JsonValueKind.True or JsonValueKind.False &&
            delta.TryGetProperty("rightExists", out JsonElement right) &&
            right.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return left.GetBoolean() != right.GetBoolean();

        return false;
    }

    private static int ScoreExportRecordDiffShape(JsonElement root, ICollection<string> factors)
    {
        int bump = 0;

        if (root.TryGetProperty("changedTopLevelFields", out JsonElement fields) && fields.ValueKind == JsonValueKind.Array)
        {
            int n = fields.GetArrayLength();

            if (n > 12)
            {
                bump += 3;
                factors.Add("Export records differ across many top-level fields — larger diff and formatting scope.");
            }
            else if (n > 6)
            {
                bump += 2;
                factors.Add("Export records differ across multiple top-level fields.");
            }
            else if (n > 0)
            {
                bump += 1;
                factors.Add("Export record top-level fields changed — additional diff narrative.");
            }
        }

        if (root.TryGetProperty("requestDiff", out JsonElement requestDiff) && requestDiff.ValueKind == JsonValueKind.Object)
        {
            int flags = requestDiff.TryGetProperty("changedFlags", out JsonElement cf) && cf.ValueKind == JsonValueKind.Array
                ? cf.GetArrayLength()
                : 0;
            int values = requestDiff.TryGetProperty("changedValues", out JsonElement cv) && cv.ValueKind == JsonValueKind.Array
                ? cv.GetArrayLength()
                : 0;
            int requestSurface = flags + values;

            if (requestSurface > 20)
            {
                bump += 2;
                factors.Add("Export request diff has many flag/value changes — deeper payload comparison during replay.");
            }
            else if (requestSurface > 8)
            {
                bump += 1;
                factors.Add("Export request diff includes several flag or value changes.");
            }
        }

        return bump;
    }

    private static int SumListLengths(JsonElement obj, string[] listPropertyNames)
    {
        int sum = 0;

        foreach (string name in listPropertyNames)
        {
            if (!obj.TryGetProperty(name, out JsonElement arr) || arr.ValueKind != JsonValueKind.Array)
                continue;

            sum += arr.GetArrayLength();
        }

        return sum;
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
