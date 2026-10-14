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

        if (lastMatch is JsonElement last
            && propertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
            && TryReadFiniteDouble(last) is not null)
        {
            value = last;

            return true;
        }

        return false;
    }

    private static bool IsNonEmptyJsonPropertyValue(JsonElement jsonElement, string structuredPropertyName)
    {
        if (structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
            && IsZeroConfidenceAliasValue(jsonElement))
        {
            return false;
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

    private static bool ObjectPropertyValueIsNonEmpty(JsonElement jsonElement, string structuredPropertyName)
    {
        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase))
            return ReasoningObjectAliasHasExtractableContent(jsonElement);

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

    private static bool ReasoningObjectAliasHasExtractableContent(JsonElement jsonElement)
    {
        if (!TryGetPropertyCaseInsensitive(jsonElement, "text", out JsonElement textElement))
            return false;

        return TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text);
    }

    private static bool ReasoningArrayEntryObjectHasExtractableContent(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitive(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
            return true;

        if (TryGetPropertyCaseInsensitive(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
            return true;

        return false;
    }
}
