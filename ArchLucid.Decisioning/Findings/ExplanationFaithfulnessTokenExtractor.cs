using System.Globalization;

namespace ArchLucid.Decisioning.Findings;

internal static class ExplanationFaithfulnessTokenExtractor
{
    private const int MaxDistinctTokens = 400;
    private const int MinTokenLength = 4;

    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "that",
        "this",
        "with",
        "from",
        "have",
        "has",
        "had",
        "were",
        "been",
        "will",
        "would",
        "could",
        "should",
        "must",
        "may",
        "might",
        "not",
        "are",
        "was",
        "and",
        "for",
        "the",
        "but",
        "any",
        "all",
        "each",
        "both",
        "such",
        "than",
        "then",
        "them",
        "their",
        "there",
        "these",
        "those",
        "into",
        "also",
        "only",
        "just",
        "more",
        "most",
        "some",
        "very",
        "when",
        "what",
        "which",
        "while",
        "where",
        "who",
        "how",
        "why",
        "your",
        "our",
        "its",
        "can",
        "did",
        "does",
        "done",
        "being",
        "over",
        "under",
        "after",
        "before",
        "between",
        "through",
        "during",
        "about",
        "against",
        "within",
        "without",
        "using",
        "based",
        "including",
        "included",
        "related",
        "overall",
        "several",
        "another",
        "other",
        "same",
        "well",
        "high",
        "low",
        "risk",
        "cost",
        "security",
        "compliance",
        "system",
        "design",
        "architecture",
        "manifest",
        "decision",
        "finding",
        "findings",
        "issue",
        "issues",
        "need",
        "needs",
        "recommend",
        "summary"
    };

    internal static HashSet<string> CollectTokens(string blob)
    {
        HashSet<string> tokens = new(StringComparer.OrdinalIgnoreCase);
        ReadOnlySpan<char> span = blob.AsSpan();
        int i = 0;

        while (i < span.Length && tokens.Count < MaxDistinctTokens)
        {
            while (i < span.Length && !char.IsLetterOrDigit(span[i]))

                i++;

            int start = i;

            while (i < span.Length && (char.IsLetterOrDigit(span[i]) || span[i] == '-' || span[i] == '_'))

                i++;

            int len = i - start;

            if (len < MinTokenLength)
                continue;

            string token = span.Slice(start, len).ToString();

            if (Stopwords.Contains(token))
                continue;

            if (long.TryParse(token, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
                continue;

            _ = tokens.Add(token);
        }

        return tokens;
    }
}
