using System.Text.Json;

namespace ArchLucid.Core;

/// <summary>Extension helpers for <see cref="JsonElement" />.</summary>
internal static class JsonElementExtensions
{
    /// <summary>
    ///     Tries to find a property whose name matches <paramref name="propertyName" /> using an
    ///     ordinal case-insensitive comparison.  Returns <see langword="false" /> immediately when
    ///     <paramref name="element" /> is not a JSON object.
    /// </summary>
    public static bool TryGetPropertyCaseInsensitive(
        this JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            value = default;

            return false;
        }

        // Fast-path: exact match (covers the common camelCase case at O(log n)).
        if (element.TryGetProperty(propertyName, out value))
            return true;

        // Fallback: case-insensitive linear scan.
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;

                return true;
            }
        }

        value = default;

        return false;
    }
}
