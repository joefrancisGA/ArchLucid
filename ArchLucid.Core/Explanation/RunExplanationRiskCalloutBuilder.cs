using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Parses risk-family fields from run explanation aggregate JSON.</summary>
public static class RunExplanationRiskCalloutBuilder
{
    public static int? TryParseUnresolvedIssueCount(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "unresolvedIssueCount", out JsonElement countEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadAggregateWholeNumberCountToken(countEl, out int count)
            ? count
            : null;
    }

    public static string? TryParseRiskPosture(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "riskPosture", out JsonElement postureEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadAggregateStringCalloutToken(postureEl, out string? posture)
            ? posture?.Trim()
            : null;
    }
}
