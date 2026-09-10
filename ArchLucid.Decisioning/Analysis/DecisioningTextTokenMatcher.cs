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

        if (pattern.Contains(' ', StringComparison.Ordinal) || pattern.Contains('$', StringComparison.Ordinal))
        {
            return haystack.Contains(pattern, StringComparison.Ordinal);
        }

        return ContainsStandaloneToken(haystack, pattern);
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
                && !IsEmbeddedInCompoundIdentifier(haystack, index, token.Length))
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
}
