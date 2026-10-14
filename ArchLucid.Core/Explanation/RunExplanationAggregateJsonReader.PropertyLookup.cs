using System.Text.Json;

namespace ArchLucid.Core.Explanation;

internal static partial class RunExplanationAggregateJsonReader
{
    public static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        value = default;
        bool found = false;

        foreach (JsonProperty property in element.EnumerateObject())
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                // Duplicate JSON properties are accepted by JsonDocument; use the last matching value like common JSON
                // deserializers so an empty first alias cannot hide a later usable model response.
                value = property.Value;
                found = true;
            }

        if (found)
            return true;

        return false;
    }

    /// <summary>
    ///     When duplicate case-variant properties appear, retain the last token that is not an empty string or empty array
    ///     so a trailing empty alias cannot discard an earlier usable model value.
    /// </summary>
    public static bool TryGetPropertyCaseInsensitivePreferLastNonEmpty(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        value = default;
        JsonElement? lastMatch = null;
        JsonElement? lastNonEmpty = null;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            lastMatch = property.Value;

            if (IsNonEmptyJsonPropertyValue(property.Value, propertyName))
                lastNonEmpty = property.Value;
        }

        if (lastNonEmpty is JsonElement nonEmpty)
        {
            value = nonEmpty;

            return true;
        }

        if (lastMatch is JsonElement confidenceLast
            && (propertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
                || propertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            && (TryReadFiniteDouble(confidenceLast) is not null
                || (propertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
                    && confidenceLast.ValueKind == JsonValueKind.Array
                    && !ArrayPropertyValueIsNonEmpty(confidenceLast, propertyName)
                    && ArrayContainsOnlyZeroNumericElements(confidenceLast))))
        {
            value = confidenceLast;

            return true;
        }

        if (lastMatch is JsonElement reasoningLast
            && propertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            && (TryReadFiniteDouble(reasoningLast) is not null
                || (reasoningLast.ValueKind == JsonValueKind.Array
                    && !ArrayPropertyValueIsNonEmpty(reasoningLast, propertyName)
                    && ArrayContainsOnlyZeroNumericElements(reasoningLast))))
        {
            value = reasoningLast;

            return true;
        }

        if (lastMatch is JsonElement stringListLast
            && IsStructuredStringListPropertyName(propertyName)
            && stringListLast.ValueKind == JsonValueKind.Array
            && !ArrayPropertyValueIsNonEmpty(stringListLast, propertyName)
            && ArrayContainsOnlyZeroNumericElements(stringListLast))
        {
            value = stringListLast;

            return true;
        }

        if (lastMatch is JsonElement stringListScalarLast
            && IsStructuredStringListPropertyName(propertyName)
            && stringListScalarLast.ValueKind != JsonValueKind.Array
            && IsZeroConfidenceAliasValue(stringListScalarLast))
        {
            value = stringListScalarLast;

            return true;
        }

        if (lastMatch is JsonElement countLast
            && IsAggregateWholeNumberCountPropertyName(propertyName)
            && IsZeroConfidenceAliasValue(countLast))
        {
            value = countLast;

            return true;
        }

        return false;
    }

    private static bool IsAggregateWholeNumberCountPropertyName(string propertyName) =>
        propertyName.Equals("citations", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("decisionCount", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("unresolvedIssueCount", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("complianceGapCount", StringComparison.OrdinalIgnoreCase);

    private static bool IsDeterministicFallbackPropertyName(string propertyName) =>
        propertyName.Equals("deterministicFallbackUsed", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("usedDeterministicFallback", StringComparison.OrdinalIgnoreCase);

    private static bool IsStructuredStringListPropertyName(string propertyName) =>
        propertyName.Equals("evidenceRefs", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("alternativesConsidered", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("caveats", StringComparison.OrdinalIgnoreCase);

    private static bool IsNonEmptyJsonPropertyValue(JsonElement jsonElement, string structuredPropertyName)
    {
        if ((structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
             || IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
             || IsStructuredStringListPropertyName(structuredPropertyName))
            && IsZeroConfidenceAliasValue(jsonElement))
        {
            return false;
        }

        if ((structuredPropertyName.Equals("citations", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase))
            && jsonElement.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            return true;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.True)
        {
            return true;
        }

        return jsonElement.ValueKind switch
        {
            JsonValueKind.Null => false,
            JsonValueKind.True or JsonValueKind.False => false,
            JsonValueKind.String => !string.IsNullOrWhiteSpace(jsonElement.GetString()),
            JsonValueKind.Array => ArrayPropertyValueIsNonEmpty(jsonElement, structuredPropertyName),
            JsonValueKind.Object => ObjectPropertyValueIsNonEmpty(jsonElement, structuredPropertyName),
            _ => true,
        };
    }

    private static bool IsZeroConfidenceAliasValue(JsonElement jsonElement)
    {
        double? finite = TryReadFiniteDouble(jsonElement);

        return finite is 0;
    }

    private static bool ArrayPropertyValueIsNonEmpty(JsonElement jsonElement, string structuredPropertyName)
    {
        foreach (JsonElement item in jsonElement.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Null)
                continue;

            if (item.ValueKind == JsonValueKind.String && string.IsNullOrWhiteSpace(item.GetString()))
                continue;

            if (item.ValueKind is JsonValueKind.True or JsonValueKind.False)
                continue;

            if ((IsStructuredStringListPropertyName(structuredPropertyName)
                 || structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
                 || structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase))
                && item.ValueKind == JsonValueKind.Number
                && TryReadFiniteDouble(item) is 0)
            {
                continue;
            }

            if (item.ValueKind == JsonValueKind.Array)
            {
                if (ArrayPropertyValueIsNonEmpty(item, structuredPropertyName))
                    return true;

                continue;
            }

            if (item.ValueKind == JsonValueKind.Object)
            {
                if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase))
                {
                    if (ReasoningArrayEntryObjectHasExtractableContent(item))
                        return true;
                }
                else if (ObjectPropertyValueIsNonEmpty(item, structuredPropertyName))
                {
                    return true;
                }

                continue;
            }

            return true;
        }

        return false;
    }

    private static bool ArrayContainsOnlyZeroNumericElements(JsonElement jsonElement)
    {
        bool sawZero = false;

        foreach (JsonElement item in jsonElement.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Number && TryReadFiniteDouble(item) is 0)
            {
                sawZero = true;

                continue;
            }

            return false;
        }

        return sawZero;
    }

    private static bool ObjectPropertyValueIsNonEmpty(JsonElement jsonElement, string structuredPropertyName)
    {
        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("alternativesConsidered", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("caveats", StringComparison.OrdinalIgnoreCase))
        {
            return ProseListObjectAliasHasExtractableContent(jsonElement);
        }

        if (structuredPropertyName.Equals("evidenceRefs", StringComparison.OrdinalIgnoreCase))
            return EvidenceRefObjectAliasHasExtractableContent(jsonElement);

        foreach (JsonProperty property in jsonElement.EnumerateObject())
        {
            if (property.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object)
                return true;

            if (TryReadNonEmptyTextToken(property.Value, out string? text)
                && !string.IsNullOrWhiteSpace(text))
                return true;
        }

        return false;
    }

    private static bool ReasoningObjectAliasHasExtractableContent(JsonElement jsonElement) =>
        ProseListObjectAliasHasExtractableContent(jsonElement);

    private static bool ProseListObjectAliasHasExtractableContent(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return true;
        }

        if (ObjectHasCaseInsensitiveProperty(jsonElement, "text"))
            return false;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
        {
            return true;
        }

        return false;
    }

    private static bool EvidenceRefObjectAliasHasExtractableContent(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
        {
            return true;
        }

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return true;
        }

        return false;
    }

    private static bool ObjectHasCaseInsensitiveProperty(JsonElement jsonElement, string propertyName)
    {
        foreach (JsonProperty property in jsonElement.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool ReasoningArrayEntryObjectHasExtractableContent(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
            return true;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
            return true;

        return false;
    }
}
