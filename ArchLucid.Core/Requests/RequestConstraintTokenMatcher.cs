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

            if (!IsNegatedPhrasePrefix(haystack, index))
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

            if (IsStandaloneWordToken(haystack, index, token.Length)
                && !IsNegatedPhrasePrefix(haystack, index))
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
                && !IsNegatedPhrasePrefix(haystack, index))
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

    private static bool IsNegatedPhrasePrefix(string haystack, int tokenIndex)
    {
        if (IsNonPrefixedNegation(haystack, tokenIndex))
            return true;

        if (IsNoPrefixedNegation(haystack, tokenIndex))
            return true;

        if (IsNotPrefixedNegation(haystack, tokenIndex))
            return true;

        if (IsWithoutPrefixedNegation(haystack, tokenIndex))
            return true;

        if (IsAdviceStyleNegation(haystack, tokenIndex))
            return true;

        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 2)
            return false;

        return before.EndsWith("un", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("un-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("un_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("un.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("un ", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNoPrefixedNegation(string haystack, int tokenIndex)
    {
        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 2)
            return false;

        return before.EndsWith("no", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("no-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("no_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("no.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("no ", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNotPrefixedNegation(string haystack, int tokenIndex)
    {
        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 3)
            return false;

        return before.EndsWith("not", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("not-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("not_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("not.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("not ", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAdviceStyleNegation(string haystack, int tokenIndex)
    {
        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 4)
            return false;

        if (before.StartsWith("not required to", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("no requirement to", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("do not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("do-not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("don't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("won't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("must not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("never", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("avoid", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("avoids", StringComparison.OrdinalIgnoreCase))
            return true;

        if (ContainsMidSentenceNegation(before))
            return true;

        return before.EndsWith("don't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("won't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("never", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("avoids", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("avoid", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsMidSentenceNegation(ReadOnlySpan<char> before)
    {
        return ContainsPhrase(before, " do not require ")
            || ContainsPhrase(before, " must not ")
            || ContainsPhrase(before, " do not ");
    }

    private static bool ContainsPhrase(ReadOnlySpan<char> haystack, string phrase)
    {
        return haystack.IndexOf(phrase.AsSpan(), StringComparison.OrdinalIgnoreCase) >= 0;
    }

    private static bool IsWithoutPrefixedNegation(string haystack, int tokenIndex)
    {
        ReadOnlySpan<char> before = haystack.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 7)
            return false;

        return before.EndsWith("without", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("without-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("without_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("without.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("without ", StringComparison.OrdinalIgnoreCase);
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
