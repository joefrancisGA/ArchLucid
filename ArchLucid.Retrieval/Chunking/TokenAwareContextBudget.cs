namespace ArchLucid.Retrieval.Chunking;

/// <summary>
///     Estimates token counts and truncates oversized text payloads before LLM calls (Ask feature context guard).
/// </summary>
public static class TokenAwareContextBudget
{
    /// <summary>Conservative chars-per-token ratio for English/JSON payloads without a tokenizer.</summary>
    public const int DefaultCharsPerTokenEstimate = 4;

    /// <summary>Default maximum estimated tokens for Ask structured context (aligns with large-context models).</summary>
    public const int DefaultMaxEstimatedTokens = 100_000;

    /// <summary>Estimates token count from character length using <paramref name="charsPerToken" />.</summary>
    public static int EstimateTokenCount(string text, int charsPerToken = DefaultCharsPerTokenEstimate)
    {
        if (string.IsNullOrEmpty(text))
            return 0;

        if (charsPerToken < 1)
            throw new ArgumentOutOfRangeException(nameof(charsPerToken));

        return (int)Math.Ceiling(text.Length / (double)charsPerToken);
    }

    /// <summary>
    ///     Returns <paramref name="text" /> unchanged when within budget; otherwise truncates with an explicit suffix note.
    /// </summary>
    public static string TruncateToTokenBudget(
        string text,
        int maxEstimatedTokens = DefaultMaxEstimatedTokens,
        int charsPerToken = DefaultCharsPerTokenEstimate,
        out bool wasTruncated)
    {
        wasTruncated = false;

        if (string.IsNullOrEmpty(text))
            return text;

        if (maxEstimatedTokens < 1)
            throw new ArgumentOutOfRangeException(nameof(maxEstimatedTokens));

        int estimated = EstimateTokenCount(text, charsPerToken);

        if (estimated <= maxEstimatedTokens)
            return text;

        wasTruncated = true;

        int maxChars = maxEstimatedTokens * charsPerToken;
        const string suffix =
            "\n\n[Context truncated: payload exceeded the configured token budget for Ask. " +
            "Rephrase with a narrower question or compare fewer runs.]";

        if (maxChars <= suffix.Length)
            return suffix.TrimStart();

        string body = text[..Math.Max(0, maxChars - suffix.Length)];

        return body + suffix;
    }
}
