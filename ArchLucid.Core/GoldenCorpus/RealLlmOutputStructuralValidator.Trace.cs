using System.Text.Json;

namespace ArchLucid.Core.GoldenCorpus;

public static partial class RealLlmOutputStructuralValidator
{
private static readonly string[] TraceListKeys =
    [
        "graphNodeIdsExamined", "rulesApplied", "decisionsTaken", "alternativePathsConsidered", "notes"
    ];

    
    private static RealLlmStructuralValidationResult? ValidateFindingTrace(JsonElement finding, int index, List<RealLlmStructuralCheckItem> checks)
    {
        if (!TryGetPropertyCaseInsensitive(finding, "trace", out JsonElement trace) || trace.ValueKind != JsonValueKind.Object)
        {
            checks.Add(new RealLlmStructuralCheckItem("findingTrace", false, $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must include an object 'trace' (ExplainabilityTrace)."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        if (TryGetPropertyCaseInsensitive(trace, "sourceAgentExecutionTraceId", out JsonElement sid) && sid.ValueKind is not (JsonValueKind.String or JsonValueKind.Null or JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False))
        {
            checks.Add(new RealLlmStructuralCheckItem("traceSourceId", false, "Optional 'sourceAgentExecutionTraceId' must be a string, number, or null when present."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        foreach (string listKey in TraceListKeys)
        {
            if (TryGetPropertyCaseInsensitive(trace, listKey, out JsonElement listEl) && listEl.ValueKind == JsonValueKind.Array) continue;
            checks.Add(new RealLlmStructuralCheckItem("traceLists", false, $"ExplainabilityTrace must include array '{listKey}' (findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}].trace)."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        return null;
    }

}
