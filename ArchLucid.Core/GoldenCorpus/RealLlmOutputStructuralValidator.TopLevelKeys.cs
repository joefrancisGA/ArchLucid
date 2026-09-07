using System.Globalization;
using System.Text.Json;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.GoldenCorpus;

public static partial class RealLlmOutputStructuralValidator
{
    private static RealLlmStructuralValidationResult? ValidateTopLevelKeys(JsonElement root, AgentType expectedEnum, List<RealLlmStructuralCheckItem> checks)
    {
        foreach (string key in BaseTopLevelKeys)
        {
            if (TryGetPropertyCaseInsensitive(root, key, out _)) continue;
            checks.Add(new RealLlmStructuralCheckItem("topLevelKeys", false, $"Missing required top-level property '{key}' on AgentResult JSON."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        if (!TryGetPropertyCaseInsensitive(root, "agentType", out JsonElement agentTypeEl))
        {
            checks.Add(new RealLlmStructuralCheckItem("agentTypeField", false, "Property 'agentType' is missing."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        if (!JsonAgentTypeMatchesExpected(agentTypeEl, expectedEnum, out string? atMsg))
        {
            checks.Add(new RealLlmStructuralCheckItem("agentTypeMatch", false, atMsg ?? "agentType mismatch."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        checks.Add(new RealLlmStructuralCheckItem("topLevelKeys", true, "All required top-level properties for AgentResult are present."));
        checks.Add(new RealLlmStructuralCheckItem("agentTypeMatch", true, $"agentType is {expectedEnum} as required."));
        return null;
    }

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
            _ => SetFalse(out message, "agentType must be a string or number.")
        };
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
}
