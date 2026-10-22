using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Parses cost-family fields from run explanation aggregate JSON.</summary>
public static class RunExplanationCostCalloutBuilder
{
    public static int? TryParseDecisionCount(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "decisionCount", out JsonElement countEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadAggregateWholeNumberCountToken(countEl, out int count)
            ? count
            : null;
    }
}
