using System.Text.Json;

namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Detects credential property names embedded in JSON effective values when the config path itself is not sensitive.
/// </summary>
internal static class ConfigurationSensitiveConfigValueScanner
{
    public static bool ContainsEmbeddedCredentialProperties(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        ReadOnlySpan<char> trimmed = value.AsSpan().TrimStart();

        if (trimmed.Length == 0 || (trimmed[0] != '{' && trimmed[0] != '['))
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(value);
            return ContainsCredentialProperties(document.RootElement);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool ContainsCredentialProperties(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (JsonProperty property in element.EnumerateObject())
                {
                    if (ConfigurationSensitiveConfigPathMatcher.IsSensitiveConfigPropertyName(property.Name))
                        return true;

                    if (ContainsCredentialProperties(property.Value))
                        return true;
                }

                return false;
            case JsonValueKind.Array:
                foreach (JsonElement item in element.EnumerateArray())
                {
                    if (ContainsCredentialProperties(item))
                        return true;
                }

                return false;
            default:
                return false;
        }
    }
}
