using System.Text.Json;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Reads string properties from inventory <c>resources.json</c> rows with case-insensitive JSON keys.
/// </summary>
internal static class InventoryResourcesJsonRowReader
{
    /// <summary>
    ///     Accepts a top-level JSON array or an object wrapper such as <c>{ "resources": [ ... ] }</c>.
    /// </summary>
    internal static bool TryGetResourceRowsArray(JsonElement root, out JsonElement arrayElement)
    {
        if (root.ValueKind is JsonValueKind.Array)
        {
            arrayElement = root;
            return true;
        }

        if (root.ValueKind is JsonValueKind.Object)
        {
            foreach (string propertyName in new[] { "resources", "value", "items" })
            {
                if (!TryGetPropertyIgnoreCase(root, propertyName, out JsonElement element))
                    continue;

                if (element.ValueKind is JsonValueKind.Array)
                {
                    arrayElement = element;
                    return true;
                }
            }
        }

        arrayElement = default;
        return false;
    }

    internal static string? TryGetTrimmedString(JsonElement row, IReadOnlyList<string> propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(row, propertyName, out JsonElement element))
                continue;

            if (element.ValueKind is not JsonValueKind.String)
                continue;

            string? value = element.GetString()?.Trim();

            if (!string.IsNullOrEmpty(value))
                return value;
        }

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

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
