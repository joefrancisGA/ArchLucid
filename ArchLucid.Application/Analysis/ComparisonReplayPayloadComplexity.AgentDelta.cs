using System.Text.Json;

namespace ArchLucid.Application.Analysis;

internal static partial class ComparisonReplayPayloadComplexity
{
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

    private static int ScoreAgentResultDiff(JsonElement deltas, ICollection<string> factors)
    {
        int bump = 0;
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
}
