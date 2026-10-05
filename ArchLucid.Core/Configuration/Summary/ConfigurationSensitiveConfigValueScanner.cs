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

        if (trimmed.Length == 0)
            return false;

        if (trimmed[0] != '{' && trimmed[0] != '[')
            return LooksLikeEmbeddedConnectionString(value);

        try
        {
            using JsonDocument document = JsonDocument.Parse(value);
            return ContainsCredentialProperties(document.RootElement);
        }
        catch (JsonException)
        {
            return LooksLikeEmbeddedConnectionString(value);
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
            case JsonValueKind.String:
                return LooksLikeEmbeddedConnectionString(element.GetString());
            default:
                return false;
        }
    }

    private static bool LooksLikeEmbeddedConnectionString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        ReadOnlySpan<char> trimmed = value.AsSpan().Trim();

        if (trimmed.Length < 8 || !trimmed.Contains('='))
            return false;

        if (StartsWithCredentialConnectionPair(trimmed))
            return true;

        if (!trimmed.Contains(';'))
            return false;

        return trimmed.Contains("Password=", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("Pwd=", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("AccountKey=", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("SharedAccessKey=", StringComparison.OrdinalIgnoreCase);
    }

    private static bool StartsWithCredentialConnectionPair(ReadOnlySpan<char> trimmed) =>
        trimmed.StartsWith("Password=", StringComparison.OrdinalIgnoreCase)
        || trimmed.StartsWith("Pwd=", StringComparison.OrdinalIgnoreCase)
        || trimmed.StartsWith("AccountKey=", StringComparison.OrdinalIgnoreCase)
        || trimmed.StartsWith("SharedAccessKey=", StringComparison.OrdinalIgnoreCase);
}
