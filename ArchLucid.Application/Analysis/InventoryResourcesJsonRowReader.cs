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

        if (TryGetTrimmedStringFromElement(row, propertyNames, out string? direct))
            return direct;

        return null;
    }

    /// <summary>
    ///     Resolves a JSON:API compound row whose cloud id lives on an <c>included</c> resource referenced by
    ///     <c>relationships.*.data</c> type/id pointers.
    /// </summary>
    internal static bool TryResolveIncludedResourceRow(JsonElement root, JsonElement row, out JsonElement resolvedRow)
    {
        resolvedRow = default;

        if (row.ValueKind is not JsonValueKind.Object)
            return false;

        if (!TryGetPropertyIgnoreCase(row, "relationships", out JsonElement relationships)
            || relationships.ValueKind is not JsonValueKind.Object)
            return false;

        foreach (JsonProperty relationship in relationships.EnumerateObject())
        {
            if (!TryGetPropertyIgnoreCase(relationship.Value, "data", out JsonElement dataElement))
                continue;

            if (dataElement.ValueKind is JsonValueKind.Object)
            {
                if (TryMatchIncludedResource(root, dataElement, out resolvedRow))
                    return true;
            }
            else if (dataElement.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement reference in dataElement.EnumerateArray())
                {
                    if (TryMatchIncludedResource(root, reference, out resolvedRow))
                        return true;
                }
            }
        }

        return false;
    }

    private static bool TryMatchIncludedResource(JsonElement root, JsonElement reference, out JsonElement resolvedRow)
    {
        resolvedRow = default;

        if (reference.ValueKind is not JsonValueKind.Object)
            return false;

        if (!TryGetPropertyIgnoreCase(reference, "type", out JsonElement typeElement)
            || typeElement.ValueKind is not JsonValueKind.String)
            return false;

        if (!TryGetPropertyIgnoreCase(reference, "id", out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
            return false;

        string? type = typeElement.GetString();
        string? id = idElement.GetString();

        if (string.IsNullOrEmpty(type) || string.IsNullOrEmpty(id))
            return false;

        if (!TryGetPropertyIgnoreCase(root, "included", out JsonElement includedElement)
            || includedElement.ValueKind is not JsonValueKind.Array)
            return false;

        foreach (JsonElement includedRow in includedElement.EnumerateArray())
        {
            if (includedRow.ValueKind is not JsonValueKind.Object)
                continue;

            if (!TryGetPropertyIgnoreCase(includedRow, "type", out JsonElement includedType)
                || includedType.ValueKind is not JsonValueKind.String)
                continue;

            if (!TryGetPropertyIgnoreCase(includedRow, "id", out JsonElement includedId)
                || includedId.ValueKind is not JsonValueKind.String)
                continue;

            if (!string.Equals(type, includedType.GetString(), StringComparison.OrdinalIgnoreCase)
                || !string.Equals(id, includedId.GetString(), StringComparison.OrdinalIgnoreCase))
                continue;

            resolvedRow = includedRow;
            return true;
        }

        return false;
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
