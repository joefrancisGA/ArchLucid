namespace ArchLucid.ContextIngestion.Infrastructure;

using System.Globalization;
using System.Text.Json;

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

    public static string CanonicalizeNumberText(JsonElement value)
    {
        if (value.TryGetDecimal(out decimal decimalValue))
        {
            decimal truncated = decimal.Truncate(decimalValue);

            if (decimalValue == truncated)
                return truncated.ToString(CultureInfo.InvariantCulture);

            return decimalValue.ToString(CultureInfo.InvariantCulture);
        }

        if (value.TryGetInt64(out long intValue))
            return intValue.ToString(CultureInfo.InvariantCulture);

        return value.GetRawText();
    }

    public static bool ShouldRedactKey(string rawKey)
    {
        if (string.IsNullOrWhiteSpace(rawKey))
            return false;

        string normalized = NormalizeSensitiveKeyName(rawKey);

        foreach (string fragment in SensitiveKeyFragments)
        {
            if (normalized.Contains(NormalizeSensitiveKeyName(fragment), StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string NormalizeSensitiveKeyName(string rawKey)
    {
        return rawKey.Trim().ToLowerInvariant().Replace("_", string.Empty, StringComparison.Ordinal);
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

        string sanitizedKey = SanitizePropertyKey(rawKey).ToLowerInvariant();

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

        string sanitizedBlockName = SanitizePropertyKey(blockName).ToLowerInvariant();

        if (string.IsNullOrEmpty(sanitizedBlockName))
            return false;

        string trimmedBody = blockBody.Trim();

        if (trimmedBody.Length > MaxPropertyValueLength)
            trimmedBody = trimmedBody[..MaxPropertyValueLength];

        properties[$"tf.{sanitizedBlockName}"] = trimmedBody.ToLowerInvariant();

        return true;
    }

    public static bool TryAddTfJsonProperty(
        Dictionary<string, string> properties,
        string rawKey,
        JsonElement value)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (CountTfProperties(properties) >= MaxTfPropertyCount)
            return false;

        if (ShouldRedactKey(rawKey))
            return TryAddTfProperty(properties, rawKey, "[REDACTED]");

        string serialized = value.GetRawText().Trim();

        if (string.IsNullOrWhiteSpace(serialized))
            return false;

        string sanitizedKey = SanitizePropertyKey(rawKey).ToLowerInvariant();

        if (string.IsNullOrEmpty(sanitizedKey))
            return false;

        if (serialized.Length > MaxPropertyValueLength)
            serialized = serialized[..MaxPropertyValueLength];

        properties[$"tf.{sanitizedKey}"] = serialized;

        return true;
    }

    public static int CountTfProperties(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        return properties.Keys.Count(static key => key.StartsWith("tf.", StringComparison.OrdinalIgnoreCase));
    }

    public const int MaxK8sPropertyCount = 24;

    public static bool TryAddK8sProperty(
        Dictionary<string, string> properties,
        string rawKey,
        string rawValue)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (CountK8sProperties(properties) >= MaxK8sPropertyCount)
            return false;

        string sanitizedKey = SanitizePropertyKey(rawKey).ToLowerInvariant();

        if (string.IsNullOrEmpty(sanitizedKey))
            return false;

        if (ShouldRedactKey(rawKey))
            return TryAddK8sProperty(properties, rawKey, "[REDACTED]");

        string valueText = CanonicalizeScalarValue(rawValue);

        if (string.IsNullOrWhiteSpace(valueText))
            return false;

        if (valueText.Length > MaxPropertyValueLength)
            valueText = valueText[..MaxPropertyValueLength];

        properties[$"k8s.{sanitizedKey}"] = valueText;

        return true;
    }

    public static int CountK8sProperties(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        return properties.Keys.Count(static key => key.StartsWith("k8s.", StringComparison.OrdinalIgnoreCase));
    }
}
