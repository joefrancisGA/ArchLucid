using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure.Canonical;

/// <summary>
///     Shared JSON element readers for infrastructure declaration canonical object mappers.
/// </summary>
public static class CanonicalInfrastructureJsonElementReader
{
    public static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
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

    /// <summary>
    ///     Tries camelCase then snake_case property names (case-insensitive) for exporter JSON variants.
    /// </summary>
    public static bool TryGetPropertyIgnoreCaseOrSnakeCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (TryGetPropertyIgnoreCase(element, propertyName, out value))
            return true;

        string snakeCase = ToSnakeCasePropertyName(propertyName);

        if (!string.Equals(snakeCase, propertyName, StringComparison.Ordinal)
            && TryGetPropertyIgnoreCase(element, snakeCase, out value))
            return true;

        value = default;

        return false;
    }

    private static string ToSnakeCasePropertyName(string propertyName)
    {
        if (string.IsNullOrEmpty(propertyName))
            return propertyName;

        Span<char> buffer = propertyName.Length + 8 <= 128
            ? stackalloc char[propertyName.Length + 8]
            : new char[propertyName.Length + 8];
        int writeIndex = 0;

        for (int i = 0; i < propertyName.Length; i++)
        {
            char c = propertyName[i];

            if (char.IsUpper(c))
            {
                if (writeIndex > 0)
                    buffer[writeIndex++] = '_';

                buffer[writeIndex++] = char.ToLowerInvariant(c);
            }
            else
            {
                buffer[writeIndex++] = c;
            }
        }

        return new string(buffer[..writeIndex]);
    }

    public static string? ReadTopLevelString(JsonElement resource, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }

    public static string? ReadMetadataString(JsonElement resource, string objectName, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(resource, objectName, out JsonElement objectElement) || objectElement.ValueKind is not JsonValueKind.Object)
            return null;

        if (!TryGetPropertyIgnoreCase(objectElement, propertyName, out JsonElement value) || value.ValueKind is not JsonValueKind.String)
            return null;

        string? text = value.GetString();

        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }
}
