using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Parses risk-family fields from run explanation aggregate JSON.</summary>
public static class RunExplanationRiskCalloutBuilder
{
    public static int? TryParseUnresolvedIssueCount(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "unresolvedIssueCount", out JsonElement countEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadWholeNumber(countEl, out int count)
            ? count
            : null;
    }

    public static string? TryParseRiskPosture(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "riskPosture", out JsonElement postureEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(postureEl, out string? posture)
            ? posture?.Trim()
            : null;
    }
}
