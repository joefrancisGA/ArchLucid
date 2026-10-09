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

        return ContainsCredentialConnectionPair(trimmed);
    }

    /// <summary>
    ///     ADO.NET and Azure storage connection strings allow whitespace around <c>=</c>.
    ///     Pair keys are recognized at the start of the value and after each semicolon.
    /// </summary>
    private static bool ContainsCredentialConnectionPair(ReadOnlySpan<char> trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {

            if (TryMatchCredentialPairAt(trimmed, index))
                return true;

            int semicolon = trimmed.Slice(index).IndexOf(';');

            if (semicolon < 0)
                return false;

            index += semicolon + 1;

            while (index < trimmed.Length && char.IsWhiteSpace(trimmed[index]))
                index++;
        }

        return false;
    }

    private static bool TryMatchCredentialPairAt(ReadOnlySpan<char> value, int index)
    {
        ReadOnlySpan<char> rest = value.Slice(index);

        foreach (string key in CredentialConnectionPairKeys)
        {

            if (!rest.StartsWith(key, StringComparison.OrdinalIgnoreCase))
                continue;

            int afterKey = key.Length;

            // "Pwd" is a prefix of "Password"; a longer identifier such as Passwordless is not a key.

            if (afterKey < rest.Length && char.IsLetterOrDigit(rest[afterKey]))
                continue;

            while (afterKey < rest.Length && char.IsWhiteSpace(rest[afterKey]))
                afterKey++;

            if (afterKey < rest.Length && rest[afterKey] == '=')
                return true;
        }

        return false;
    }

    private static readonly string[] CredentialConnectionPairKeys =
    [
        "Password",
        "Pwd",
        "AccountKey",
        "AccessKey",
        "ApiKey",
        "ClientSecret",
        "SharedAccessKey",
    ];
}
