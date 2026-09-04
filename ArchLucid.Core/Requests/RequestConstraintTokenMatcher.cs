namespace ArchLucid.Core.Requests;

/// <summary>
///     Standalone token matching for free-text architecture constraints and capabilities.
/// </summary>
internal static class RequestConstraintTokenMatcher
{
    internal static bool ContainsAffirmativePhrase(string? haystack, string phrase)
    {
        if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(phrase))
            return false;

        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf(phrase, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (!IsNonPrefixedNegation(haystack, index))
                return true;

            index++;
        }

        return false;
    }

    internal static bool ContainsStandaloneWordToken(string? haystack, string token)
    {
        if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(token))
            return false;

        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf(token, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (IsStandaloneWordToken(haystack, index, token.Length))
                return true;

            index++;
        }

        return false;
    }

    internal static bool ContainsAffirmativePrivateWord(string? haystack)
    {
        if (string.IsNullOrWhiteSpace(haystack))
            return false;

        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf("private", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (IsStandaloneWordToken(haystack, index, "private".Length)
                && !IsNonPrefixedNegation(haystack, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsStandaloneWordToken(string haystack, int tokenIndex, int tokenLength)
    {
        bool okBefore = tokenIndex == 0 || !char.IsLetter(haystack[tokenIndex - 1]);

        int afterToken = tokenIndex + tokenLength;

        bool okAfter = afterToken >= haystack.Length || !char.IsLetter(haystack[afterToken]);

        return okBefore && okAfter;
    }

    private static bool IsNonPrefixedNegation(string haystack, int tokenIndex)
    {
        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 3)
            return false;

        return before.EndsWith("non", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non ", StringComparison.OrdinalIgnoreCase);
    }
}
