using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.GoldenCorpus;

/// <summary>
///     Content-agnostic JSON checks for a single <see cref="ArchLucid.Contracts.Agents.AgentResult" /> document returned
///     from the API (camelCase). Does not assert on claim text, finding messages, or category values.
/// </summary>
public static partial class RealLlmOutputStructuralValidator
{
    private static readonly string[] BaseTopLevelKeys =
    [
        "resultId", "taskId", "runId", "agentType", "claims", "evidenceRefs", "confidence", "createdUtc", "findings"
    ];

    public static RealLlmStructuralValidationResult ValidateAgentResultStructure(string agentType, string resultJson)
    {
        if (string.IsNullOrWhiteSpace(agentType))
            return Fail("agentTypeParameter", "The agentType parameter is required.");
        if (!TryResolveAgentType(agentType.Trim(), out AgentType expectedEnum, out string? typeParseError))
            return Fail("expectedAgentType", typeParseError ?? "Unknown agent type.");
        List<RealLlmStructuralCheckItem> checks = [];
        JsonDocument? doc;
        try { doc = JsonDocument.Parse(resultJson); }
        catch (JsonException ex)
        {
            checks.Add(new RealLlmStructuralCheckItem("jsonSyntax", false, ex.Message));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        using (doc)
        {
            JsonElement root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                checks.Add(new RealLlmStructuralCheckItem("rootObject", false, "Root JSON value must be an object."));
                return new RealLlmStructuralValidationResult(false, checks);
            }
            RealLlmStructuralValidationResult? topLevelResult = ValidateTopLevelKeys(root, expectedEnum, checks);
            if (topLevelResult is not null) return topLevelResult;
            RealLlmStructuralValidationResult? findingsResult = ValidateFindings(root, checks);
            if (findingsResult is not null) return findingsResult;
            checks.Add(new RealLlmStructuralCheckItem("explainabilityTraceShape", true, "Each finding has a trace object with ExplainabilityTrace list fields, non-empty severity, and content."));
            return new RealLlmStructuralValidationResult(RealLlmStructuralValidationResult.AllPassed(checks), checks);
        }
    }

    private static RealLlmStructuralValidationResult Fail(string name, string message) =>
        new(false, [new RealLlmStructuralCheckItem(name, false, message)]);

    private static bool TryReadNonEmptyTextToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            value = element.GetString();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind == JsonValueKind.Number)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return !string.IsNullOrWhiteSpace(value);
        }

        value = null;

        return false;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
