using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Shared deterministic signals for instruction-override / injection patterns used by request prechecks and evidence
///     package mitigations.
/// </summary>
public static class PromptInjectionPatternSignals
{
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromMilliseconds(250);

    /// <summary>
    ///     One regex per injection family (same alternation as a single pattern, but isolated) so matching stays linear in
    ///     practice and avoids cross-branch backtracking that can hit <see cref="Regex.MatchTimeoutException" /> on
    ///     routine text under a short match timeout.
    /// </summary>
    private static readonly Regex[] InjectionFamilyPatterns =
    [
        new Regex(
            @"ignore\s+(the\s+)?(prior|earlier|preceding)\s+(instructions|rules|prompts)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(
            @"(disregard|forget)\s+(your|all)\s+(prior|earlier|previous|system)\s+(instructions|rules|prompt)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(
            @"reveal\s+(your|the)\s+(system|hidden)\s+(prompt|instructions)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(
            @"act\s+as\s+(a\s+|an\s+)?(unrestricted|unfiltered|jailbroken)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(
            @"developer\s+mode",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bdan\s+mode\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(
            @"pretend\s+you\s+(have\s+no|are\s+without)\s+(rules|restrictions|guidelines)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bexecute\s+shell\s*:", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bignore\s+all\s+prior\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bignore\s+all\s+previous\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled, RegexTimeout),
        new Regex(@"developer\s*[\-\u2013]\s*mode", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\brm\s+-rf\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bkubectl\s+drain\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"(?:call|invoke)\s+delete_database\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled, RegexTimeout),
        new Regex(@"\bdelete_database\s+tool\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"<tool\s+name\s*=", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            RegexTimeout),
        new Regex(@"\bkeys?\s+from\s+env\s+vars\s+to\s+https?://",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled, RegexTimeout),
        new Regex(@"\buse\s+curl\s+to\s+post\b.{0,120}\b(keys?|secrets?|credentials)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled, RegexTimeout),
    ];

    private static readonly string[] BlockedPhrases =
    [
        "ignore previous instructions",
        "ignore all previous",
        "ignore all prior",
        "ignore all instructions",
        "disregard previous",
        "disregard all previous",
        "new instructions:",
        "you are now",
        "new system prompt",
        "override safety",
        "jailbreak",
        "disregard your earlier rules"
    ];

    private static bool MatchesAnyInjectionFamily(string normalized)
    {
        foreach (Regex pattern in InjectionFamilyPatterns)
        {
            if (pattern.IsMatch(normalized))
                return true;
        }

        return false;
    }

    /// <summary>Returns structured reasons when <paramref name="text" /> matches a blocked phrase or regex family.</summary>
    public static IReadOnlyList<string> Evaluate(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return [];

        List<string> reasons = [];
        string normalized = Normalize(text);

        reasons.AddRange(from phrase in BlockedPhrases
            where normalized.Contains(phrase, StringComparison.Ordinal)
            select string.Format(CultureInfo.InvariantCulture, "matches blocked phrase \"{0}\".", phrase));

        if (MatchesAnyInjectionFamily(normalized))
            reasons.Add("matches a tuned injection-pattern family.");

        return reasons;
    }

    /// <summary>Formats evaluation reasons with a field label for request-level audits.</summary>
    public static void AccumulateForField(string? text, string fieldLabel, List<string> reasons)
    {
        ArgumentNullException.ThrowIfNull(reasons);

        if (string.IsNullOrEmpty(text))
            return;

        foreach (string detail in Evaluate(text))

            reasons.Add(
                string.Format(CultureInfo.InvariantCulture, "Field {0} {1}", fieldLabel, detail));
    }

    /// <summary>
    ///     Same normalization as ingress request precheck (Form-C + homoglyph fold + lowercase) so phrase and regex rules
    ///     stay aligned across surfaces.
    /// </summary>
    public static string Normalize(string text)
    {
        string formC = text.Trim().Normalize(NormalizationForm.FormC);
        string folded = FoldCommonLatinLookalikes(formC);

        return folded.ToLowerInvariant();
    }

    /// <summary>
    ///     Maps a small set of Cyrillic letters that are commonly swapped into English tokens to bypass substring checks.
    /// </summary>
    private static string FoldCommonLatinLookalikes(string text)
    {
        bool changed = false;

        Span<char> buffer = stackalloc char[text.Length];

        for (int i = 0; i < text.Length; i++)
        {
            char ch = text[i];
            char mapped = MapUnicodeHomoglyph(ch);

            if (mapped != ch)
                changed = true;

            buffer[i] = mapped;
        }

        return changed ? buffer.ToString() : text;
    }

    private static char MapUnicodeHomoglyph(char ch)
    {
        return ch switch
        {
            '\u0410' => 'A',
            '\u0430' => 'a',
            '\u0415' => 'E',
            '\u0435' => 'e',
            '\u041E' => 'O',
            '\u043E' => 'o',
            '\u0420' => 'P',
            '\u0440' => 'p',
            '\u0421' => 'C',
            '\u0441' => 'c',
            '\u0423' => 'Y',
            '\u0443' => 'y',
            '\u0425' => 'X',
            '\u0445' => 'x',
            '\u0406' => 'I',
            '\u0456' => 'i',
            _ => ch,
        };
    }
}
