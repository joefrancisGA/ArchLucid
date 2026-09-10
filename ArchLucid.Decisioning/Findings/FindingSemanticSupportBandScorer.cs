using System.Text;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Deterministic quote-overlap heuristic for semantic support band scoring (AS-057 / TB-1228 Lane A-adjacent).
///     Empty citations are a provenance problem (ADR 0082), not scored here.
/// </summary>
public static class FindingSemanticSupportBandScorer
{
    private const int MinExactQuoteSpanLength = 16;

    public static FindingSemanticSupportBand Score(
        string? findingMessage,
        IReadOnlyList<string>? citationExcerpts)
    {
        if (string.IsNullOrWhiteSpace(findingMessage))
            return FindingSemanticSupportBand.NotScored;

        if (citationExcerpts is null || citationExcerpts.Count == 0)
            return FindingSemanticSupportBand.NotScored;

        string citationBlob = BuildCitationBlob(citationExcerpts);

        if (string.IsNullOrWhiteSpace(citationBlob))
            return FindingSemanticSupportBand.NotScored;

        if (HasExactQuoteOverlap(findingMessage, citationBlob))
            return FindingSemanticSupportBand.Supported;

        HashSet<string> findingTokens = ExplanationFaithfulnessTokenExtractor.CollectTokens(findingMessage);
        HashSet<string> citationTokens = ExplanationFaithfulnessTokenExtractor.CollectTokens(citationBlob);

        if (findingTokens.Count == 0)
            return FindingSemanticSupportBand.NotScored;

        int matched = findingTokens.Count(token => citationTokens.Contains(token));

        if (matched == 0)
            return FindingSemanticSupportBand.Unsupported;

        return FindingSemanticSupportBand.Unchecked;
    }

    private static string BuildCitationBlob(IReadOnlyList<string> citationExcerpts)
    {
        StringBuilder builder = new();

        for (int i = 0; i < citationExcerpts.Count; i++)
        {
            string excerpt = citationExcerpts[i];

            if (string.IsNullOrWhiteSpace(excerpt))
                continue;

            if (builder.Length > 0)
                builder.Append('\n');

            builder.Append(excerpt.Trim());
        }

        return builder.ToString();
    }

    private static bool HasExactQuoteOverlap(string findingMessage, string citationBlob)
    {
        string normalizedFinding = NormalizeWhitespace(findingMessage);
        string normalizedCitation = NormalizeWhitespace(citationBlob);

        if (normalizedFinding.Length >= MinExactQuoteSpanLength
            && normalizedCitation.Contains(normalizedFinding, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        foreach (string segment in SplitQuotableSegments(findingMessage))
        {
            string normalizedSegment = NormalizeWhitespace(segment);

            if (normalizedSegment.Length < MinExactQuoteSpanLength)
                continue;

            if (normalizedCitation.Contains(normalizedSegment, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static IEnumerable<string> SplitQuotableSegments(string findingMessage)
    {
        yield return findingMessage;

        foreach (string sentence in findingMessage.Split(['.', '!', '?', ';'], StringSplitOptions.RemoveEmptyEntries))
        {
            string trimmed = sentence.Trim();

            if (trimmed.Length > 0)
                yield return trimmed;
        }
    }

    private static string NormalizeWhitespace(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        StringBuilder builder = new(value.Length);
        bool previousWasSpace = false;

        foreach (char character in value.Trim())
        {
            if (char.IsWhiteSpace(character))
            {
                if (!previousWasSpace)
                {
                    builder.Append(' ');
                    previousWasSpace = true;
                }

                continue;
            }

            builder.Append(character);
            previousWasSpace = false;
        }

        return builder.ToString();
    }
}
