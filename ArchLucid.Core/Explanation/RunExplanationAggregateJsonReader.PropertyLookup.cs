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
        bool found = false;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!IsNonEmptyJsonPropertyValue(property.Value))
                continue;

            value = property.Value;
            found = true;
        }

        return found;
    }

    private static bool IsNonEmptyJsonPropertyValue(JsonElement jsonElement) =>
        jsonElement.ValueKind switch
        {
            JsonValueKind.Null => false,
            JsonValueKind.String => !string.IsNullOrWhiteSpace(jsonElement.GetString()),
            JsonValueKind.Array => jsonElement.GetArrayLength() > 0,
            _ => true,
        };
}
