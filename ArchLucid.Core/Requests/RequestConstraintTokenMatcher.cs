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

            if (!IsNegatedPhrasePrefix(haystack, index)
                && !IsNegatedPhraseSuffix(haystack, index, phrase.Length))
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
                && !IsNegatedPhrasePrefix(haystack, index)
                && !IsNegatedPhraseSuffix(haystack, index, token.Length))
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
                && !IsNegatedPhrasePrefix(haystack, index)
                && !IsNegatedPhraseSuffix(haystack, index, "private".Length))
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
            || before.StartsWith("no need to", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("doesn't require", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("doesn't need to", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("won't need to", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("do not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("do-not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("don't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("doesn't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("shouldn't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("won't", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("must not", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("never", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("avoid", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("avoids", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("cannot use", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("cannot require", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("cannot", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not enable", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not use", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not have", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not require", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not need", StringComparison.OrdinalIgnoreCase))
            return true;

        if (ContainsMidSentenceNegation(before))
            return true;

        return before.EndsWith("don't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("doesn't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("shouldn't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("won't", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("cannot", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("cannot require", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("never", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("avoids", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("avoid", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsMidSentenceNegation(ReadOnlySpan<char> before)
    {
        return ContainsPhrase(before, " do not require ")
            || ContainsPhrase(before, " should not require ")
            || ContainsPhrase(before, " should not require")
            || ContainsPhrase(before, " shall not require ")
            || ContainsPhrase(before, " shall not require")
            || ContainsPhrase(before, " will not require ")
            || ContainsPhrase(before, " will not require")
            || ContainsPhrase(before, " would not require ")
            || ContainsPhrase(before, " would not require")
            || ContainsPhrase(before, " must not ")
            || ContainsPhrase(before, " do not ")
            || ContainsPhrase(before, " doesn't require ")
            || ContainsPhrase(before, " doesn't need ")
            || ContainsPhrase(before, " cannot require ");
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

    private static bool IsNegatedPhraseSuffix(string haystack, int tokenIndex, int tokenLength)
    {
        ReadOnlySpan<char> after = haystack.AsSpan(tokenIndex + tokenLength).TrimStart();

        if (after.Length < 2)
            return false;

        if (after.StartsWith("not required", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("not needed", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("not necessary", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("is not required", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("is not needed", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("is not necessary", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("is unnecessary", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("isn't required", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("isn't needed", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("is optional", StringComparison.OrdinalIgnoreCase)
            || after.StartsWith("need not", StringComparison.OrdinalIgnoreCase))
            return true;

        return ContainsPhrase(after, " need not ");
    }
}
