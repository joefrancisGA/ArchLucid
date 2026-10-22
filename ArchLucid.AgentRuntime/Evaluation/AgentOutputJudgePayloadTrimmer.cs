using System.Globalization;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Caps judge-bound agent/evidence payloads without splitting UTF-16 surrogate pairs.
/// </summary>
internal static class AgentOutputJudgePayloadTrimmer
{
    internal static string Trim(string text, int maxChars)
    {
        maxChars = Math.Max(4096, maxChars);

        if (text.Length <= maxChars)
            return text;

        int cut = maxChars;

        if (cut > 0 && cut < text.Length && char.IsHighSurrogate(text[cut - 1]))
            cut--;

        return text.Substring(0, cut) +
               "\n…truncated_total_chars=" +
               text.Length.ToString(CultureInfo.InvariantCulture);
    }
}
