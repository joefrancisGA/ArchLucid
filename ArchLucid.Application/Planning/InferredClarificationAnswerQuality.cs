using System.Text.RegularExpressions;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Buyer-safe readability gate for clarification answer snippets extracted from documents.
/// </summary>
public static class InferredClarificationAnswerQuality
{
    private static readonly Regex MojibakeMarkers =
        new(@"(?:â€|Ã.|Â§|ï¿½|\uFFFD)", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ActorsTableHeaderPattern =
        new(@"Actors\s+Actor\s+How they touch", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DiagramCaptionPattern =
        new(@"Diagram\s*[—\-]", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static bool IsReadableInferredClarificationAnswer(string answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
            return false;

        string trimmed = answer.Trim();

        if (IsInternalRephrasePayload(trimmed))
            return false;

        if (trimmed.EndsWith("...", StringComparison.Ordinal))
            return false;

        if (EndsWithDanglingPunctuation(trimmed))
            return false;

        if (MojibakeMarkers.IsMatch(trimmed))
            return false;

        if (ActorsTableHeaderPattern.IsMatch(trimmed))
            return false;

        if (DiagramCaptionPattern.IsMatch(trimmed))
            return false;

        int letters = trimmed.Count(char.IsLetter);

        if (letters < 3)
            return false;

        double letterRatio = (double)letters / trimmed.Length;

        if (letterRatio < 0.35)
            return false;

        if (IsStructuredConstraintAnswer(trimmed))
            return true;

        if (!ContainsSentencePunctuation(trimmed) && !StartsWithYesOrNo(trimmed))
            return false;

        return true;
    }

    private static bool IsStructuredConstraintAnswer(string text)
    {
        if (text is "Azure" or "Aws" or "Gcp" or "None")
            return true;

        if (text.Contains("RTO", StringComparison.OrdinalIgnoreCase)
            || text.Contains("RPO", StringComparison.OrdinalIgnoreCase))
            return true;

        if (text.StartsWith("Monthly cost ceiling about $", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(text, "None for this lifecycle stage.", StringComparison.Ordinal))
            return true;

        return false;
    }

    private static bool EndsWithDanglingPunctuation(string text)
    {
        return text.EndsWith('—') || text.EndsWith('-') || text.EndsWith('→');
    }

    private static bool ContainsSentencePunctuation(string text)
    {
        return text.Contains('.', StringComparison.Ordinal)
               || text.Contains('!', StringComparison.Ordinal)
               || text.Contains('?', StringComparison.Ordinal);
    }

    private static bool StartsWithYesOrNo(string text)
    {
        return text.StartsWith("Yes", StringComparison.OrdinalIgnoreCase)
               || text.StartsWith("No", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsInternalRephrasePayload(string text)
    {
        return text.StartsWith("Evidence excerpt (answer only from this text):", StringComparison.OrdinalIgnoreCase);
    }
}
