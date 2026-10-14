using System.Text.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>Parses compliance-family fields from run explanation aggregate JSON.</summary>
public static class RunExplanationComplianceCalloutBuilder
{
    public static int? TryParseComplianceGapCount(JsonElement root)
    {
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(root, "complianceGapCount", out JsonElement countEl))
            return null;

        return RunExplanationAggregateJsonReader.TryReadAggregateWholeNumberCountToken(countEl, out int count)
            ? count
            : null;
    }
}
