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
}
