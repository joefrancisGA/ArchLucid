using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.GoldenCorpus;

/// <summary>
///     Content-agnostic JSON checks for a single <see cref="ArchLucid.Contracts.Agents.AgentResult" /> document returned
///     from the API (camelCase). Does not assert on claim text, finding messages, or category values.
/// </summary>
public static class RealLlmOutputStructuralValidator
{
    private static readonly string[] BaseTopLevelKeys =
    [
        "resultId", "taskId", "runId", "agentType", "claims", "evidenceRefs", "confidence", "createdUtc", "findings"
    ];

    /// <summary>ExplainabilityTrace list fields; <c>sourceAgentExecutionTraceId</c> is optional and may be null/omitted.</summary>
    private static readonly string[] TraceListKeys =
    [
        "graphNodeIdsExamined", "rulesApplied", "decisionsTaken", "alternativePathsConsidered", "notes"
    ];

    /// <summary>
    ///     Candidate field names for a finding's human-readable content. At least one must be a non-empty string on
    ///     every finding so that structurally valid but completely hollow findings are caught.
    /// </summary>
    private static readonly string[] FindingContentFields = ["description", "message", "title", "detail"];

    /// <summary>
    ///     Validates that <paramref name="resultJson" /> is a well-formed <c>AgentResult</c> with a non-empty
    ///     <c>findings</c> array and a <c>trace</c> object on every finding (ExplainabilityTrace shape).
    /// </summary>
    /// <param name="agentType">Expected <c>agentType</c> (e.g. <c>Topology</c>); must match the JSON <c>agentType</c> field.</param>
    /// <param name="resultJson">Raw JSON (typically camelCase from the contract serializer).</param>
    public static RealLlmStructuralValidationResult ValidateAgentResultStructure(string agentType, string resultJson)
    {
        if (string.IsNullOrWhiteSpace(agentType))
            return Fail("agentTypeParameter", "The agentType parameter is required.");

        if (!TryResolveAgentType(agentType.Trim(), out AgentType expectedEnum, out string? typeParseError))
            return Fail("expectedAgentType", typeParseError ?? "Unknown agent type.");

        List<RealLlmStructuralCheckItem> checks = [];

        JsonDocument? doc;

        try
        {
            doc = JsonDocument.Parse(resultJson);
        }
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
                checks.Add(
                    new RealLlmStructuralCheckItem("rootObject", false, "Root JSON value must be an object."));

                return new RealLlmStructuralValidationResult(false, checks);
            }

            foreach (string key in BaseTopLevelKeys)
            {
                if (TryGetPropertyCaseInsensitive(root, key, out _))
                    continue;

                checks.Add(
                    new RealLlmStructuralCheckItem(
                        "topLevelKeys",
                        false,
                        $"Missing required top-level property '{key}' on AgentResult JSON."));

                return new RealLlmStructuralValidationResult(false, checks);
            }

            if (!TryGetPropertyCaseInsensitive(root, "agentType", out JsonElement agentTypeEl))
            {
                checks.Add(
                    new RealLlmStructuralCheckItem("agentTypeField", false, "Property 'agentType' is missing."));

                return new RealLlmStructuralValidationResult(false, checks);
            }

            if (!JsonAgentTypeMatchesExpected(agentTypeEl, expectedEnum, out string? atMsg))
            {
                checks.Add(new RealLlmStructuralCheckItem("agentTypeMatch", false, atMsg ?? "agentType mismatch."));

                return new RealLlmStructuralValidationResult(false, checks);
            }

            checks.Add(
                new RealLlmStructuralCheckItem(
                    "topLevelKeys",
                    true,
                    "All required top-level properties for AgentResult are present."));

            checks.Add(
                new RealLlmStructuralCheckItem("agentTypeMatch", true, $"agentType is {expectedEnum} as required."));

            if (!TryGetPropertyCaseInsensitive(root, "findings", out JsonElement findings) || findings.ValueKind != JsonValueKind.Array
                                                                           || findings.GetArrayLength() == 0)
            {
                checks.Add(
                    new RealLlmStructuralCheckItem(
                        "findingsNonEmpty",
                        false,
                        "Property 'findings' must be a non-empty JSON array."));

                return new RealLlmStructuralValidationResult(false, checks);
            }

            checks.Add(
                new RealLlmStructuralCheckItem("findingsNonEmpty", true, "Findings array is non-empty."));

            int index = 0;

            foreach (JsonElement finding in findings.EnumerateArray())
            {
                if (finding.ValueKind != JsonValueKind.Object)
                {
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "findingObject",
                            false,
                            $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must be an object."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                if (!TryGetPropertyCaseInsensitive(finding, "trace", out JsonElement trace) || trace.ValueKind != JsonValueKind.Object)
                {
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "findingTrace",
                            false,
                            $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must include an object 'trace' (ExplainabilityTrace)."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                if (TryGetPropertyCaseInsensitive(trace, "sourceAgentExecutionTraceId", out JsonElement sid)
                    && sid.ValueKind is not (
                        JsonValueKind.String
                        or JsonValueKind.Null
                        or JsonValueKind.Number
                        or JsonValueKind.True
                        or JsonValueKind.False))
                {
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "traceSourceId",
                            false,
                            "Optional 'sourceAgentExecutionTraceId' must be a string, number, or null when present."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                foreach (string listKey in TraceListKeys)
                {
                    if (TryGetPropertyCaseInsensitive(trace, listKey, out JsonElement listEl) &&
                        listEl.ValueKind == JsonValueKind.Array)
                        continue;
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "traceLists",
                            false,
                            $"ExplainabilityTrace must include array '{listKey}' (findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}].trace)."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                // Severity must be a non-empty string or numeric token — a blank severity indicates a hollow or truncated finding.

                if (!TryGetPropertyCaseInsensitive(finding, "severity", out JsonElement severityEl)
                    || !TryReadNonEmptyTextToken(severityEl, out _))
                {
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "findingSeverity",
                            false,
                            $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must have a non-empty string 'severity'."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                // At least one content field must be non-empty so hollow findings (all keys present, all blank) are caught.
        bool hasContent = FindingContentFields.Any(f =>
            TryGetPropertyCaseInsensitive(finding, f, out JsonElement el)
            && TryReadNonEmptyTextToken(el, out _));

                if (!hasContent)
                {
                    checks.Add(
                        new RealLlmStructuralCheckItem(
                            "findingContent",
                            false,
                            $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must have at least one non-empty content field (description, message, title, or detail)."));

                    return new RealLlmStructuralValidationResult(false, checks);
                }

                index++;
            }

            checks.Add(
                new RealLlmStructuralCheckItem(
                    "explainabilityTraceShape",
                    true,
                    "Each finding has a trace object with ExplainabilityTrace list fields, non-empty severity, and content."));

            return new RealLlmStructuralValidationResult(RealLlmStructuralValidationResult.AllPassed(checks), checks);
        }
    }

    private static RealLlmStructuralValidationResult Fail(string name, string message) =>
        new(
            false,
            [new RealLlmStructuralCheckItem(name, false, message)]);

    private static bool TryResolveAgentType(
        string input,
        out AgentType type,
        out string? error)
    {
        type = default;
        error = null;

        if (Enum.TryParse(input, true, out type) && Enum.IsDefined(type))
            return true;

        if (int.TryParse(input, System.Globalization.NumberStyles.Integer,
                System.Globalization.CultureInfo.InvariantCulture, out int n)
            && Enum.IsDefined(typeof(AgentType), n))
        {
            type = (AgentType)n;

            return true;
        }

        if (TryParseWholeNumberString(input.Trim(), out int wholeNumberOrdinal)
            && Enum.IsDefined(typeof(AgentType), wholeNumberOrdinal))
        {
            type = (AgentType)wholeNumberOrdinal;

            return true;
        }

        if (TryParseBooleanOrdinalString(input.Trim(), out int booleanOrdinal)
            && Enum.IsDefined(typeof(AgentType), booleanOrdinal))
        {
            type = (AgentType)booleanOrdinal;

            return true;
        }

        error = $"Parameter agentType '{input}' is not a valid AgentType name or integer.";

        return false;
    }

    private static bool JsonAgentTypeMatchesExpected(JsonElement agentTypeEl, AgentType expected, out string? message)
    {
        message = null;

        return agentTypeEl.ValueKind switch
        {
            JsonValueKind.String => EnumTryParseLenient(agentTypeEl.GetString(), expected, out message),
            JsonValueKind.Number => TryReadWholeNumberAgentType(agentTypeEl, expected, out message),
            JsonValueKind.True or JsonValueKind.False => TryReadBooleanOrdinalAgentType(agentTypeEl, expected, out message),
            _ => SetFalse(out message, "agentType must be a string, number, or boolean.")
        };
    }

    private static bool TryReadBooleanOrdinalAgentType(JsonElement agentTypeEl, AgentType expected, out string? message)
    {
        message = null;

        int agentTypeOrdinal = agentTypeEl.ValueKind == JsonValueKind.True ? 1 : 0;

        if (!Enum.IsDefined(typeof(AgentType), agentTypeOrdinal))
        {
            return SetMsg(out message, "agentType boolean ordinal does not match the expected type.");
        }

        if ((AgentType)agentTypeOrdinal == expected)
        {
            return true;
        }

        return SetMsg(out message, "agentType boolean ordinal does not match the expected type.");
    }

    private static bool TryReadWholeNumberAgentType(JsonElement agentTypeEl, AgentType expected, out string? message)
    {
        message = null;

        if (!TryReadWholeNumberInt32(agentTypeEl, out int agentTypeOrdinal))
        {
            return SetFalse(out message, "agentType must be a string or number.");
        }

        if (!Enum.IsDefined(typeof(AgentType), agentTypeOrdinal))
        {
            return SetMsg(out message, "agentType number does not match the expected type.");
        }

        if ((AgentType)agentTypeOrdinal == expected)
        {
            return true;
        }

        return SetMsg(out message, "agentType number does not match the expected type.");
    }

    private static bool TryReadWholeNumberInt32(JsonElement element, out int value)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            value = default;

            return false;
        }

        if (element.TryGetInt32(out value))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool EnumTryParseLenient(string? text, AgentType expected, out string? message)
    {
        message = null;

        if (string.IsNullOrWhiteSpace(text))
        {
            message = "agentType string is empty.";

            return false;
        }

        if (TryParseWholeNumberString(text, out int agentTypeOrdinal)
            && Enum.IsDefined(typeof(AgentType), agentTypeOrdinal))
        {
            if ((AgentType)agentTypeOrdinal == expected)
            {
                return true;
            }

            return SetMsg(out message, "agentType number does not match the expected type.");
        }

        if (TryParseBooleanOrdinalString(text, out int booleanOrdinal)
            && Enum.IsDefined(typeof(AgentType), booleanOrdinal))
        {
            if ((AgentType)booleanOrdinal == expected)
            {
                return true;
            }

            return SetMsg(out message, "agentType number does not match the expected type.");
        }

        if (Enum.TryParse(text, true, out AgentType t) && t == expected)
            return true;

        message = $"JSON agentType '{text}' does not match expected {expected}.";

        return false;
    }

    private static bool SetMsg(out string? m, string text)
    {
        m = text;

        return false;
    }

    private static bool SetFalse(out string? m, string text)
    {
        m = text;

        return false;
    }

    private static bool TryParseBooleanOrdinalString(string? raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

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
