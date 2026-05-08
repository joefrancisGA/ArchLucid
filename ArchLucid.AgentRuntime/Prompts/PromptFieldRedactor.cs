using System.Text.RegularExpressions;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Redacts sensitive patterns from free-text before inclusion in LLM user prompts (email, bearer-like tokens,
///     cloud secrets, payment identifiers).
/// </summary>
public static class PromptFieldRedactor
{
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromMilliseconds(250);

    private static readonly Regex EmailLike = new(
        @"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    private static readonly Regex SkOrBearerLike = new(
        @"(?i)\b(sk-[a-zA-Z0-9]{16,}|Bearer\s+[a-zA-Z0-9\-._~+/]{20,})\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>Azure SAS token query (?sv=…&amp;sig=…).</summary>
    private static readonly Regex AzureSasQuery = new(
        @"\?[^?\s""']*\bsig=[^&\s""']+",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>Azure storage connection string account key segment.</summary>
    private static readonly Regex AzureAccountKeyInConn = new(
        @"(?i)AccountKey=[^;""'\s]+",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>AWS access key id prefix.</summary>
    private static readonly Regex AwsAccessKeyId = new(
        @"\bAKIA[0-9A-Z]{16}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>AWS secret access key (classic 40-char base62-ish).</summary>
    private static readonly Regex AwsSecretKey40 = new(
        @"\b[A-Za-z0-9/+=]{40}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>JWT-shaped three base64url segments.</summary>
    private static readonly Regex JwtLike = new(
        @"\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>PEM private key header.</summary>
    private static readonly Regex PemPrivateKeyHeader = new(
        "-----BEGIN [^-]+PRIVATE KEY-----",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>US SSN-shaped numeric triplets.</summary>
    private static readonly Regex UsSsnShaped = new(
        @"\b\d{3}-\d{2}-\d{4}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>SSH/RSA/EC header blocks through footer.</summary>
    private static readonly Regex PemPrivateKeyBlock = new(
        @"-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    /// <summary>Apply log sanitization plus pattern redaction families.</summary>
    public static string RedactForPrompt(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        string s = LogSanitizer.Sanitize(text);
        s = PemPrivateKeyBlock.Replace(s, "[redacted-pem-private-key]");
        s = PemPrivateKeyHeader.Replace(s, "[redacted-pem-private-key]");
        s = AzureSasQuery.Replace(s, "[redacted-azure-sas]");
        s = AzureAccountKeyInConn.Replace(s, "[redacted-azure-account-key]");
        s = AwsAccessKeyId.Replace(s, "[redacted-aws-access-key-id]");
        s = AwsSecretKey40.Replace(s, m => LooksLikeAwsSecret(m.Value) ? "[redacted-aws-secret-key]" : m.Value);
        s = JwtLike.Replace(s, "[redacted-jwt]");
        s = UsSsnShaped.Replace(s, m => LooksLikeSsnSegments(m.Value) ? "[redacted-ssn-shaped]" : m.Value);
        s = CreditCardLike.Replace(s, m => PassesLuhn(m.Value.Replace("-", "").Replace(" ", ""))
            ? "[redacted-pan-shaped]"
            : m.Value);
        s = EmailLike.Replace(s, "[redacted-email]");
        s = SkOrBearerLike.Replace(s, "[redacted-secret]");

        return s;
    }

    /// <summary>16-digit groups with optional separators.</summary>
    private static readonly Regex CreditCardLike = new(
        @"\b(?:\d{4}[-\s]?){3}\d{4}\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        MatchTimeout);

    private static bool LooksLikeAwsSecret(string value)
    {
        if (value.Length != 40)

            return false;

        int letters = value.Count(char.IsLetter);

        int digits = value.Count(char.IsDigit);

        return letters >= 10 && digits >= 8;
    }

    private static bool LooksLikeSsnSegments(string value)
    {
        string[] parts = value.Split('-');

        return parts.Length == 3 && parts.All(p => p.Length > 0 && p.All(char.IsDigit));
    }

    private static bool PassesLuhn(string digitsOnly)
    {
        if (digitsOnly.Length is < 13 or > 19 || !digitsOnly.All(char.IsDigit))
            return false;

        int sum = 0;
        bool alternate = false;

        for (int i = digitsOnly.Length - 1; i >= 0; i--)
        {
            int n = digitsOnly[i] - '0';

            if (alternate)
            {
                n *= 2;

                if (n > 9)

                    n -= 9;
            }

            sum += n;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }
}
