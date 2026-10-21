using ArchLucid.Core.Requests;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Standalone token and phrase matching for decisioning free-text heuristics.
/// </summary>
internal static class DecisioningTextTokenMatcher
{
    internal static bool ContainsPattern(string? haystack, string pattern)
    {
        if (string.IsNullOrEmpty(haystack) || string.IsNullOrEmpty(pattern))
        {
            return false;
        }

        if (pattern.Contains('$', StringComparison.Ordinal))
        {
            return haystack.Contains(pattern, StringComparison.Ordinal);
        }

        if (ControlPhraseMatcher.TryMatchCatalogPattern(haystack, pattern, out bool catalogMatches))
        {
            return catalogMatches;
        }

        haystack = haystack.ToLowerInvariant();
        pattern = pattern.ToLowerInvariant();

        if (pattern.Contains(' ', StringComparison.Ordinal))
        {
            return ContainsStandalonePhrase(haystack, pattern);
        }

        return ContainsStandaloneToken(haystack, pattern);
    }

    private static bool ContainsStandalonePhrase(string haystack, string phrase)
    {
        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf(phrase, index, StringComparison.Ordinal);

            if (index < 0)
            {
                return false;
            }

            int afterPhrase = index + phrase.Length;
            bool hasBoundaryBefore = index == 0 || !char.IsLetterOrDigit(haystack[index - 1]);
            bool hasBoundaryAfter = afterPhrase >= haystack.Length || !char.IsLetterOrDigit(haystack[afterPhrase]);

            if (hasBoundaryBefore
                && hasBoundaryAfter
                && !IsNegatedNonPrefix(haystack, index)
                && !IsNoArticleNegation(haystack, index)
                && !IsDoNotRequirePhraseNegation(haystack, index))
            {
                return true;
            }

            index++;
        }

        return false;
    }

    internal static bool ContainsStandaloneToken(string haystack, string token)
    {
        if (string.IsNullOrEmpty(haystack) || string.IsNullOrEmpty(token))
        {
            return false;
        }

        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf(token, index, StringComparison.Ordinal);

            if (index < 0)
            {
                return false;
            }

            if (IsStandaloneToken(haystack, index, token.Length)
                && !IsEmbeddedInCompoundIdentifier(haystack, index, token.Length)
                && !IsNegatedNonPrefix(haystack, index))
            {
                return true;
            }

            index++;
        }

        return false;
    }

    private static bool IsStandaloneToken(string haystack, int tokenIndex, int tokenLength)
    {
        bool okBefore = tokenIndex == 0 || !char.IsLetter(haystack[tokenIndex - 1]);
        int afterToken = tokenIndex + tokenLength;
        bool okAfter = afterToken >= haystack.Length || !char.IsLetter(haystack[afterToken]);

        return okBefore && okAfter;
    }

    private static bool IsEmbeddedInCompoundIdentifier(string haystack, int tokenIndex, int tokenLength)
    {
        if (HasHyphenOrUnderscoreCompoundBoundaries(haystack, tokenIndex, tokenLength))
        {
            return true;
        }

        return HasAlphanumericCompoundBoundaries(haystack, tokenIndex, tokenLength);
    }

    private static bool HasHyphenOrUnderscoreCompoundBoundaries(string haystack, int tokenIndex, int tokenLength)
    {
        bool precededByConnector = HasAlphanumericBeforeConnector(haystack, tokenIndex);
        int afterToken = tokenIndex + tokenLength;
        bool followedByConnector = HasAlphanumericAfterConnector(haystack, afterToken);

        return precededByConnector && followedByConnector;
    }

    private static bool HasAlphanumericCompoundBoundaries(string haystack, int tokenIndex, int tokenLength)
    {
        bool precededByAlphanumeric = tokenIndex > 0 && char.IsLetterOrDigit(haystack[tokenIndex - 1]);
        int afterToken = tokenIndex + tokenLength;
        bool followedByAlphanumeric = afterToken < haystack.Length && char.IsLetterOrDigit(haystack[afterToken]);

        return precededByAlphanumeric && followedByAlphanumeric;
    }

    private static bool HasAlphanumericBeforeConnector(string haystack, int tokenIndex)
    {
        if (tokenIndex < 2)
        {
            return false;
        }

        char connector = haystack[tokenIndex - 1];

        if (!IsCompoundIdentifierDelimiter(connector))
        {
            return false;
        }

        return char.IsLetterOrDigit(haystack[tokenIndex - 2]);
    }

    private static bool HasAlphanumericAfterConnector(string haystack, int afterToken)
    {
        if (afterToken + 1 >= haystack.Length)
        {
            return false;
        }

        char connector = haystack[afterToken];

        if (!IsCompoundIdentifierDelimiter(connector))
        {
            return false;
        }

        return char.IsLetterOrDigit(haystack[afterToken + 1]);
    }

    private static bool IsCompoundIdentifierDelimiter(char connector)
    {
        return connector is '-' or '_' or '.' or '/' or ':' or '\\' or '|' or '+';
    }

    /// <summary>
    ///     A keyword of five letters or more may prefix a longer product token
    ///     (<c>cosmos</c> in <c>cosmosdb</c>, <c>postgres</c> in <c>postgresql</c>).
    ///     Shorter cues stay whole tokens so <c>sql</c> does not match <c>nosql</c>.
    /// </summary>
    internal static bool IsLongerProductToken(string part, string keyword)
    {
        if (string.IsNullOrEmpty(part) || string.IsNullOrEmpty(keyword))
        {
            return false;
        }

        if (keyword.Length < 5 || part.Length <= keyword.Length)
        {
            return false;
        }

        if (!part.StartsWith(keyword, StringComparison.Ordinal))
        {
            return false;
        }

        return char.IsLetter(part[keyword.Length]);
    }

    internal static bool ContainsAffirmativePrivateKeyword(string text) =>
        ControlPhraseMatcher.TextAffirmsPrivateWord(text);

    private static bool IsNegatedNonPrefix(string haystack, int tokenIndex)
    {
        if (tokenIndex >= 4
            && haystack.AsSpan(tokenIndex - 4, 4).Equals("non-", StringComparison.Ordinal))
        {
            return true;
        }

        return tokenIndex >= 4
            && haystack.AsSpan(tokenIndex - 4, 4).Equals("non ", StringComparison.Ordinal);
    }

    private static bool IsNoArticleNegation(string haystack, int tokenIndex)
    {
        if (tokenIndex < 3)
        {
            return false;
        }

        return haystack.AsSpan(tokenIndex - 3, 3).Equals("no ".AsSpan(), StringComparison.Ordinal);
    }

    private static bool IsDoNotRequirePhraseNegation(string haystack, int phraseStartIndex)
    {
        const int maxLookback = 64;
        int windowStart = Math.Max(0, phraseStartIndex - maxLookback);
        string prefix = haystack[windowStart..phraseStartIndex];

        ReadOnlySpan<string> negationPhrases =
        [
            "do not require ",
            "do not use ",
            "do not mandate ",
            "do not need ",
            "do not deploy ",
            "without ",
        ];

        foreach (string negationPhrase in negationPhrases)
        {
            if (prefix.Contains(negationPhrase, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
