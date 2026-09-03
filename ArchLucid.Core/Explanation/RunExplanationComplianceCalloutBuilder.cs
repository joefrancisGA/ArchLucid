using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Parses compliance-family fields from run explanation aggregate JSON.</summary>
public static class RunExplanationComplianceCalloutBuilder
{
    public static int? TryParseComplianceGapCount(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "complianceGapCount", out JsonElement countEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadWholeNumber(countEl, out int count)
            ? count
            : null;
    }
}
