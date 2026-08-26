namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Shared <c>tf.*</c> property bag rules for infrastructure declaration parsers
///     (truncation, redaction, and per-resource caps).
/// </summary>
public static class CanonicalInfrastructurePropertyBag
{
    public const int MaxTfPropertyCount = 24;

    public const int MaxPropertyValueLength = 512;

    private static readonly string[] SensitiveKeyFragments =
    [
        "password",
        "secret",
        "token",
        "connection_string",
        "access_key",
        "private_key",
        "client_secret",
        "primary_key",
    ];

    public static string SanitizePropertyKey(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return string.Empty;

        ReadOnlySpan<char> span = name.AsSpan();
        Span<char> buffer = stackalloc char[span.Length];
        int writeIndex = 0;

        foreach (char character in span)
        {
            if (char.IsLetterOrDigit(character) || character is '_' or '-')
                buffer[writeIndex++] = character;
            else
                buffer[writeIndex++] = '_';
        }

        return new string(buffer[..writeIndex]);
    }

    public static bool ShouldRedactKey(string rawKey)
    {
        if (string.IsNullOrWhiteSpace(rawKey))
            return false;

        string normalized = rawKey.Trim().ToLowerInvariant();

        foreach (string fragment in SensitiveKeyFragments)
        {
            if (normalized.Contains(fragment, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    public static string CanonicalizeScalarValue(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
            return string.Empty;

        return rawValue.Trim().ToLowerInvariant();
    }

    public static bool TryAddTfProperty(
        Dictionary<string, string> properties,
        string rawKey,
        string rawValue)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (CountTfProperties(properties) >= MaxTfPropertyCount)
            return false;

        string sanitizedKey = SanitizePropertyKey(rawKey);

        if (string.IsNullOrEmpty(sanitizedKey))
            return false;

        string valueText = ShouldRedactKey(rawKey)
            ? "[REDACTED]"
            : CanonicalizeScalarValue(rawValue);

        if (string.IsNullOrWhiteSpace(valueText))
            return false;

        if (valueText.Length > MaxPropertyValueLength)
            valueText = valueText[..MaxPropertyValueLength];

        properties[$"tf.{sanitizedKey}"] = valueText;

        return true;
    }

    public static bool TryAddTfBlockProperty(
        Dictionary<string, string> properties,
        string blockName,
        string blockBody)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (string.IsNullOrWhiteSpace(blockBody))
            return false;

        string sanitizedBlockName = SanitizePropertyKey(blockName);

        if (string.IsNullOrEmpty(sanitizedBlockName))
            return false;

        string trimmedBody = blockBody.Trim();

        if (trimmedBody.Length > MaxPropertyValueLength)
            trimmedBody = trimmedBody[..MaxPropertyValueLength];

        properties[$"tf.{sanitizedBlockName}"] = trimmedBody.ToLowerInvariant();

        return true;
    }

    public static int CountTfProperties(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        return properties.Keys.Count(static key => key.StartsWith("tf.", StringComparison.OrdinalIgnoreCase));
    }
}
