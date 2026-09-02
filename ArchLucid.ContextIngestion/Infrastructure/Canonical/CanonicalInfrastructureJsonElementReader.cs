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
