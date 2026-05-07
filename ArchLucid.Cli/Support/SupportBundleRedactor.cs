using System.Collections;
using System.Text.RegularExpressions;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Removes credentials and other sensitive material from strings included in support bundles.
/// </summary>
public static class SupportBundleRedactor
{
    /// <summary>Identifiers for bundle manifest transparency — kept stable for operator diffing.</summary>
    public static IReadOnlyList<string> TextPatternRedactionRules { get; } =
    [
        "strip-authorization-bearer-secret",
        "strip-x-api-key-header-secret",
        "mask-connection-keyword-secrets",
        "mask-jwt-like-tokens",
        "mask-json-escaped-jwt-strings",
        "mask-openai-sk-shaped-keys",
        "mask-inline-apikey-assignments",
        "mask-json-quoted-apikey-clientsecret",
        "truncate-long-llm-json-string-values"
    ];

    private static readonly Regex BearerHeader = new(
        @"(?i)(Authorization\s*:\s*Bearer\s+)[^\s\r\n""]+",
        RegexOptions.Compiled);

    private static readonly Regex ApiKeyHeader = new(
        @"(?i)(X-Api-Key\s*:\s*)[^\r\n]+",
        RegexOptions.Compiled);

    private static readonly Regex ConnectionSecret = new(
        @"(?i)(\b(?:Password|Pwd|AccountKey|SharedAccessKey)\s*=\s*)[^\s;""]+",
        RegexOptions.Compiled);

    /// <summary>
    ///     JWT emitted inside JSON string literals as <c>\\u0022...\u0022</c> (the last digit of <c>0022</c> precedes
    ///     <c>eyJ</c>, which breaks naive word-boundary detection).
    /// </summary>
    private static readonly Regex JwtEmbeddedInJsonEscapedUnicodeQuotes = new(
        @"\\u0022eyJ[^.\\]+\.[^.\\]+\.[^.\\]+\\u0022",
        RegexOptions.Compiled);

    /// <summary>JWT-shaped three-segment tokens (base64url header.payload.signature) in logs and plain strings.</summary>
    private static readonly Regex JwtLikeToken = new(
        @"(?<!\w)eyJ[^.\s""\\]{8,}\.[^.\s""\\]{10,}\.[^.\s""\\]{8,}(?!\w)",
        RegexOptions.Compiled);

    /// <summary>OpenAI-style API keys in pasted logs.</summary>
    private static readonly Regex OpenAiSkKey = new(
        @"(?<!\w)sk-(?:proj-)?[A-Za-z0-9]{16,}(?!\w)",
        RegexOptions.Compiled);

    private static readonly Regex InlineApiKeyAssignment = new(
        @"(?i)(\b(?:ApiKey|ClientSecret|Secret)(?:\s*[:=])\s*)([^\s"",\r\n]+)",
        RegexOptions.Compiled);

    private static readonly Regex JsonQuotedApiKeyOrClientSecret = new(
        @"(?i)(""(?:apiKey|clientSecret)""\s*:\s*"")([^""\\]{3,})("")",
        RegexOptions.Compiled);

    /// <summary>
    ///     Drops large JSON string fields that often hold LLM prompts/responses (simple quoted strings only — sufficient for
    ///     typical log lines).
    /// </summary>
    private static readonly Regex LongLlmJsonString = new(
        @"(?i)(""(?:content|systemPrompt|userPrompt|rawResponse)""\s*:\s*"")([^""\\]{400,})("")",
        RegexOptions.Compiled);

    private static readonly HashSet<string> SensitiveEnvironmentNameSubstrings =
    [
        "PASSWORD", "SECRET", "API_KEY", "APIKEY", "TOKEN", "CREDENTIAL", "PRIVATE_KEY", "CONN", "CONNECTIONSTRING"
    ];

    /// <summary>
    ///     Returns a display-safe API base URL: strips userinfo (e.g. <c>https://user:pass@host</c> → <c>https://host</c>).
    /// </summary>
    public static string RedactHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return string.Empty;

        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out Uri? uri))
            return "(invalid url)";

        UriBuilder builder = new(uri) { UserName = string.Empty, Password = string.Empty };

        return builder.Uri.GetLeftPart(UriPartial.Path).TrimEnd('/');
    }

    /// <summary>
    ///     True when an environment variable name suggests a secret value (never emit the value in bundles).
    /// </summary>
    public static bool IsSensitiveEnvironmentVariableName(string name)
    {
        if (string.IsNullOrEmpty(name))
            return false;

        if (name.StartsWith("ARCHLUCID_", StringComparison.OrdinalIgnoreCase)
            && name.Contains("SQL", StringComparison.OrdinalIgnoreCase))
            return true;

        string upper = name.ToUpperInvariant();

        foreach (string fragment in SensitiveEnvironmentNameSubstrings)

            if (upper.Contains(fragment, StringComparison.Ordinal))
                return true;

        return false;
    }

    /// <summary>
    ///     Builds a map of non-sensitive environment keys to safe values, and sensitive keys to the literal <c>"(set)"</c> or
    ///     <c>"(not set)"</c> only.
    /// </summary>
    public static IReadOnlyDictionary<string, string> SnapshotEnvironmentForBundle()
    {
        Dictionary<string, string> result = new(StringComparer.OrdinalIgnoreCase);

        foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
        {
            string key = entry.Key.ToString() ?? string.Empty;

            if (string.IsNullOrEmpty(key))
                continue;

            if (!key.StartsWith("ARCHLUCID_", StringComparison.OrdinalIgnoreCase)
                && !key.StartsWith("DOTNET_", StringComparison.OrdinalIgnoreCase))

                continue;

            if (IsSensitiveEnvironmentVariableName(key))
            {
                string? val = entry.Value?.ToString();

                result[key] = string.IsNullOrEmpty(val) ? "(not set)" : "(set)";
            }
            else
            {
                string raw = entry.Value?.ToString() ?? string.Empty;

                if (string.Equals(key, "ARCHLUCID_API_URL", StringComparison.OrdinalIgnoreCase)
                    && raw.StartsWith("http", StringComparison.OrdinalIgnoreCase))

                    result[key] = RedactHttpUrl(raw);

                else

                    result[key] = raw;
            }
        }

        return result;
    }

    /// <summary>
    ///     Applies pattern redaction suitable for JSON/text written into a support bundle (never trusted public).
    /// </summary>
    public static string RedactSensitivePatterns(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return text ?? string.Empty;

        string s = BearerHeader.Replace(text, m => m.Groups[1].Value + "[REDACTED]");
        s = ApiKeyHeader.Replace(s, m => m.Groups[1].Value + "[REDACTED]");
        s = ConnectionSecret.Replace(s, m => m.Groups[1].Value + "[REDACTED]");
        s = JwtEmbeddedInJsonEscapedUnicodeQuotes.Replace(s, @"\\u0022[REDACTED_JWT]\\u0022");
        s = JwtLikeToken.Replace(s, "[REDACTED_JWT]");
        s = OpenAiSkKey.Replace(s, "[REDACTED_API_KEY]");
        s = InlineApiKeyAssignment.Replace(s, m => m.Groups[1].Value + "[REDACTED]");
        s = JsonQuotedApiKeyOrClientSecret.Replace(s, m => m.Groups[1].Value + "[REDACTED]" + m.Groups[3].Value);
        s = LongLlmJsonString.Replace(s, m => m.Groups[1].Value + "[REDACTED_LONG_STRING]" + m.Groups[3].Value);

        return s;
    }
}
