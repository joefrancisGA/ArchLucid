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
            foreach (string propertyName in new[] { "resources", "value", "items", "included" })
            {
                if (!TryGetPropertyIgnoreCase(root, propertyName, out JsonElement element))
                    continue;

                if (element.ValueKind is JsonValueKind.Array)
                {
                    arrayElement = element;
                    return true;
                }
            }

            if (TryGetPropertyIgnoreCase(root, "data", out JsonElement dataElement))
            {
                if (dataElement.ValueKind is JsonValueKind.Array)
                {
                    arrayElement = dataElement;
                    return true;
                }

                if (dataElement.ValueKind is JsonValueKind.Object
                    && TryGetResourceRowsArray(dataElement, out arrayElement))
                    return true;
            }
        }

        arrayElement = default;
        return false;
    }

    /// <summary>
    ///     Enumerates inventory rows from a parsed root element (array, wrapper object, or single resource object).
    /// </summary>
    internal static IEnumerable<JsonElement> EnumerateResourceRows(JsonElement root)
    {
        if (TryGetResourceRowsArray(root, out JsonElement rowsElement))
        {
            foreach (JsonElement row in rowsElement.EnumerateArray())
                yield return row;
        }
        else if (root.ValueKind is JsonValueKind.Object)
        {
            yield return root;
        }

        if (root.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(root, "included", out JsonElement includedElement)
            && includedElement.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement row in includedElement.EnumerateArray())
                yield return row;
        }
    }

    internal static string? TryGetTrimmedString(JsonElement row, IReadOnlyList<string> propertyNames)
    {
        if (TryGetTrimmedStringFromElement(row, propertyNames, out string? direct))
            return direct;

        if (row.ValueKind is JsonValueKind.Object)
        {
            foreach (string wrapperPropertyName in new[] { "attributes", "properties", "configuration" })
            {
                if (!TryGetPropertyIgnoreCase(row, wrapperPropertyName, out JsonElement wrapperElement)
                    || wrapperElement.ValueKind is not JsonValueKind.Object)
                    continue;

                if (TryGetTrimmedStringFromElement(wrapperElement, propertyNames, out string? nested))
                    return nested;
            }
        }

        return null;
    }

    private static bool TryGetTrimmedStringFromElement(
        JsonElement row,
        IReadOnlyList<string> propertyNames,
        out string? value)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(row, propertyName, out JsonElement element))
                continue;

            if (element.ValueKind is not JsonValueKind.String)
                continue;

            value = element.GetString()?.Trim();

            if (!string.IsNullOrEmpty(value))
                return true;
        }

        value = null;
        return false;
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
