using System.Text.Json;

using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Resolves dotted context field paths on <see cref="Finding" /> for decision-rule criteria checks.
/// </summary>
internal static class DecisionRuleContextFieldResolver
{
    private static readonly JsonSerializerOptions PayloadJsonOptions =
        new(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true };

    internal static bool TryResolve(Finding finding, string fieldPath, out string? value)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (string.IsNullOrWhiteSpace(fieldPath))
        {
            value = null;
            return false;
        }

        string[] segments = fieldPath.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
        {
            value = null;
            return false;
        }

        if (string.Equals(segments[0], "properties", StringComparison.OrdinalIgnoreCase))
        {
            if (segments.Length < 2)
            {
                value = null;
                return false;
            }

            string key = segments[1];

            if (finding.Properties.TryGetValue(key, out string? propertyValue))
            {
                value = propertyValue;
                return true;
            }

            value = null;
            return false;
        }

        if (string.Equals(segments[0], "payload", StringComparison.OrdinalIgnoreCase))
        {
            if (segments.Length < 2 || finding.Payload is null)
            {
                value = null;
                return false;
            }

            return TryResolvePayloadPath(finding.Payload, segments.Skip(1).ToArray(), out value);
        }

        if (segments.Length != 1)
        {
            value = null;
            return false;
        }

        return TryResolveFindingEnvelopeField(finding, segments[0], out value);
    }

    private static bool TryResolveFindingEnvelopeField(Finding finding, string fieldName, out string? value)
    {
        if (string.Equals(fieldName, "category", StringComparison.OrdinalIgnoreCase))
        {
            value = finding.Category;
            return true;
        }

        if (string.Equals(fieldName, "engineType", StringComparison.OrdinalIgnoreCase))
        {
            value = finding.EngineType;
            return true;
        }

        if (string.Equals(fieldName, "title", StringComparison.OrdinalIgnoreCase))
        {
            value = finding.Title;
            return true;
        }

        if (string.Equals(fieldName, "findingType", StringComparison.OrdinalIgnoreCase))
        {
            value = finding.FindingType;
            return true;
        }

        if (string.Equals(fieldName, "severity", StringComparison.OrdinalIgnoreCase))
        {
            value = finding.Severity.ToString();
            return true;
        }

        value = null;
        return false;
    }

    private static bool TryResolvePayloadPath(object payload, string[] segments, out string? value)
    {
        JsonElement root;

        if (payload is JsonElement element)
            root = element;
        else
        {
            try
            {
                root = JsonSerializer.SerializeToElement(payload, PayloadJsonOptions);
            }
            catch (JsonException)
            {
                value = null;
                return false;
            }
        }

        JsonElement current = root;

        foreach (string segment in segments)
        {
            if (current.ValueKind != JsonValueKind.Object)
            {
                value = null;
                return false;
            }

            if (!current.TryGetProperty(segment, out JsonElement next))
            {
                value = null;
                return false;
            }

            current = next;
        }

        value = JsonElementToString(current);
        return value is not null;
    }

    private static string? JsonElementToString(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.GetRawText(),
            JsonValueKind.True => bool.TrueString,
            JsonValueKind.False => bool.FalseString,
            JsonValueKind.Null => null,
            _ => element.GetRawText()
        };
    }
}
