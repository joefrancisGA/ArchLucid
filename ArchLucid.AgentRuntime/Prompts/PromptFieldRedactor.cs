using System.Text.RegularExpressions;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Redacts sensitive patterns from free-text before inclusion in LLM user prompts (email, bearer-like tokens).
/// </summary>
public static class PromptFieldRedactor
{
    private static readonly Regex EmailLike = new(
        @"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(250));

    private static readonly Regex SkOrBearerLike = new(
        @"(?i)\b(sk-[a-zA-Z0-9]{16,}|Bearer\s+[a-zA-Z0-9\-._~+/]{20,})\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(250));

    /// <summary>Apply log sanitization plus email and bearer-like token redaction.</summary>
    public static string RedactForPrompt(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        string s = LogSanitizer.Sanitize(text);
        s = EmailLike.Replace(s, "[redacted-email]");
        s = SkOrBearerLike.Replace(s, "[redacted-secret]");

        return s;
    }
}
