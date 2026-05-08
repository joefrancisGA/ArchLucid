using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Heuristic precheck only — does not replace a full LLM content-safety service. Blocks high-signal
///     instruction-override phrases common in prompt-injection attempts (substring + curated regex families).
/// </summary>
public sealed class DefaultRequestContentSafetyPrecheck : IRequestContentSafetyPrecheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromMilliseconds(250);

    private static readonly Regex InjectionFamilies =
        new(
            @"ignore\s+(the\s+)?(prior|earlier|preceding)\s+(instructions|rules|prompts)"
            + @"|(disregard|forget)\s+(your|all)\s+(prior|earlier|previous|system)\s+(instructions|rules|prompt)"
            + @"|reveal\s+(your|the)\s+(system|hidden)\s+(prompt|instructions)"
            + @"|act\s+as\s+(a\s+|an\s+)?(unrestricted|unfiltered|jailbroken)"
            + @"|developer\s+mode"
            + @"|\bdan\s+mode\b"
            + @"|pretend\s+you\s+(have\s+no|are\s+without)\s+(rules|restrictions|guidelines)"
            + @"|\bexecute\s+shell\s*:"
            + @"|\bignore\s+all\s+prior\b"
            + @"|\bignore\s+all\s+previous\b"
            + @"|developer\s*[\-\u2013]\s*mode"
            + @"|\brm\s+-rf\b"
            + @"|\bkubectl\s+drain\b"
            + @"|(?:call|invoke)\s+delete_database\b"
            + @"|\bdelete_database\s+tool\b"
            + @"|<tool\s+name\s*="
            + @"|\bkeys?\s+from\s+env\s+vars\s+to\s+https?://"
            + @"|\buse\s+curl\s+to\s+post\b.{0,120}\b(keys?|secrets?|credentials)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
            Timeout);

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

    public Task<RequestContentSafetyResult> EvaluateAsync(ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        List<string> reasons = [];

        Accumulate(request.Description, nameof(request.Description), reasons);
        Accumulate(request.SystemName, nameof(request.SystemName), reasons);

        foreach (string req in request.InlineRequirements)

            Accumulate(req, nameof(request.InlineRequirements), reasons);

        foreach (ContextDocumentRequest doc in request.Documents)
        {
            Accumulate(doc.Name, $"{nameof(request.Documents)}.{nameof(ContextDocumentRequest.Name)}", reasons);
            Accumulate(doc.Content, $"{nameof(request.Documents)}.{nameof(ContextDocumentRequest.Content)}", reasons);
        }

        return Task.FromResult(new RequestContentSafetyResult { IsAllowed = reasons.Count == 0, Reasons = reasons });
    }

    private static void Accumulate(string? text, string fieldLabel, List<string> reasons)
    {
        if (string.IsNullOrEmpty(text))
            return;

        string normalized = Normalize(text);

        reasons.AddRange(from phrase in BlockedPhrases
            where normalized.Contains(phrase, StringComparison.Ordinal)
            select string.Format(
                CultureInfo.InvariantCulture,
                "Field {0} matches blocked phrase \"{1}\".",
                fieldLabel,
                phrase));

        if (InjectionFamilies.IsMatch(normalized))

            reasons.Add(string.Format(CultureInfo.InvariantCulture,
                "Field {0} matches a tuned injection-pattern family.", fieldLabel));
    }

    private static string Normalize(string text)
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
