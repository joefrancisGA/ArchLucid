namespace ArchLucid.ContextIngestion.Infrastructure;

using System.Globalization;
using System.Text;
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

        string normalizedBody = NormalizeHclBlockBody(StripHclComments(trimmedBody.ToLowerInvariant()));

        properties[$"tf.{sanitizedBlockName}"] = normalizedBody;

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

        string serialized = CanonicalInfrastructureJsonValue.CanonicalizeText(value);

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

    internal static string NormalizeHclBlockBody(string blockBody)
    {
        if (string.IsNullOrWhiteSpace(blockBody))
            return blockBody;

        string[] lines = blockBody.Split('\n');
        StringBuilder builder = new();

        for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
        {
            string trimmedLine = lines[lineIndex].Trim();

            if (trimmedLine.Length == 0)
                continue;

            if (trimmedLine.StartsWith('#') || trimmedLine.StartsWith("//", StringComparison.Ordinal))
                continue;

            int equalsIndex = trimmedLine.IndexOf('=');

            if (equalsIndex > 0)
            {
                string key = trimmedLine[..equalsIndex].Trim();
                string assignmentValue = StripTrailingHclComment(trimmedLine[(equalsIndex + 1)..].Trim());

                if (builder.Length > 0)
                    builder.Append(' ');

                builder.Append(key);
                builder.Append(" = ");
                builder.Append(assignmentValue);
                continue;
            }

            if (builder.Length > 0)
                builder.Append(' ');

            builder.Append(StripTrailingHclComment(trimmedLine));
        }

        return builder.ToString();
    }

    internal static string StripHclComments(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        StringBuilder builder = new();
        bool inQuotes = false;

        for (int index = 0; index < text.Length; index++)
        {
            char character = text[index];

            if (character == '"')
            {
                inQuotes = !inQuotes;
                builder.Append(character);
                continue;
            }

            if (character == '#' && !inQuotes)
            {
                while (index + 1 < text.Length && text[index + 1] is not '\n' and not '\r')
                    index++;

                continue;
            }

            builder.Append(character);
        }

        return builder.ToString();
    }

    internal static string StripTrailingHclComment(string rawValue)
    {
        int hashIndex = rawValue.IndexOf('#');

        if (hashIndex < 0)
            return rawValue;

        return rawValue[..hashIndex].TrimEnd();
    }
}
