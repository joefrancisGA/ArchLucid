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
            || before.StartsWith("is not required to", StringComparison.OrdinalIgnoreCase)
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
            || before.StartsWith("need not adopt", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not deploy", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not mandate", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not enforce", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not configure", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not apply", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not provision", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not require", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not implement", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not maintain", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("is not needed for", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("is not necessary for", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not require", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not need", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not mandate", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not enforce", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not configure", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not apply", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not provision", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not ensure", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("does not maintain", StringComparison.OrdinalIgnoreCase)
            || before.StartsWith("need not ensure", StringComparison.OrdinalIgnoreCase))
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
            || ContainsPhrase(before, " should not need ")
            || ContainsPhrase(before, " should not need")
            || ContainsPhrase(before, " shall not require ")
            || ContainsPhrase(before, " shall not require")
            || ContainsPhrase(before, " shall not need ")
            || ContainsPhrase(before, " shall not need")
            || ContainsPhrase(before, " will not require ")
            || ContainsPhrase(before, " will not require")
            || ContainsPhrase(before, " would not require ")
            || ContainsPhrase(before, " would not require")
            || ContainsPhrase(before, " will not need ")
            || ContainsPhrase(before, " will not need")
            || ContainsPhrase(before, " would not need ")
            || ContainsPhrase(before, " would not need")
            || ContainsPhrase(before, " will not mandate ")
            || ContainsPhrase(before, " will not mandate")
            || ContainsPhrase(before, " would not mandate ")
            || ContainsPhrase(before, " would not mandate")
            || ContainsPhrase(before, " shall not mandate ")
            || ContainsPhrase(before, " shall not mandate")
            || ContainsPhrase(before, " should not mandate ")
            || ContainsPhrase(before, " should not mandate")
            || ContainsPhrase(before, " ought not mandate ")
            || ContainsPhrase(before, " ought not mandate")
            || ContainsPhrase(before, " ought not require ")
            || ContainsPhrase(before, " ought not require")
            || ContainsPhrase(before, " ought not need ")
            || ContainsPhrase(before, " ought not need")
            || ContainsPhrase(before, " will not enforce ")
            || ContainsPhrase(before, " will not enforce")
            || ContainsPhrase(before, " would not enforce ")
            || ContainsPhrase(before, " would not enforce")
            || ContainsPhrase(before, " shall not enforce ")
            || ContainsPhrase(before, " shall not enforce")
            || ContainsPhrase(before, " will not configure ")
            || ContainsPhrase(before, " will not configure")
            || ContainsPhrase(before, " would not configure ")
            || ContainsPhrase(before, " would not configure")
            || ContainsPhrase(before, " shall not configure ")
            || ContainsPhrase(before, " shall not configure")
            || ContainsPhrase(before, " cannot mandate ")
            || ContainsPhrase(before, " cannot mandate")
            || ContainsPhrase(before, " should not enforce ")
            || ContainsPhrase(before, " should not enforce")
            || ContainsPhrase(before, " ought not enforce ")
            || ContainsPhrase(before, " ought not enforce")
            || ContainsPhrase(before, " cannot enforce ")
            || ContainsPhrase(before, " cannot enforce")
            || ContainsPhrase(before, " will not apply ")
            || ContainsPhrase(before, " will not apply")
            || ContainsPhrase(before, " would not apply ")
            || ContainsPhrase(before, " would not apply")
            || ContainsPhrase(before, " shall not apply ")
            || ContainsPhrase(before, " shall not apply")
            || ContainsPhrase(before, " should not configure ")
            || ContainsPhrase(before, " should not configure")
            || ContainsPhrase(before, " ought not configure ")
            || ContainsPhrase(before, " ought not configure")
            || ContainsPhrase(before, " cannot apply ")
            || ContainsPhrase(before, " cannot apply")
            || ContainsPhrase(before, " should not apply ")
            || ContainsPhrase(before, " should not apply")
            || ContainsPhrase(before, " ought not apply ")
            || ContainsPhrase(before, " ought not apply")
            || ContainsPhrase(before, " cannot configure ")
            || ContainsPhrase(before, " cannot configure")
            || ContainsPhrase(before, " will not provision ")
            || ContainsPhrase(before, " will not provision")
            || ContainsPhrase(before, " would not provision ")
            || ContainsPhrase(before, " would not provision")
            || ContainsPhrase(before, " shall not provision ")
            || ContainsPhrase(before, " shall not provision")
            || ContainsPhrase(before, " cannot provision ")
            || ContainsPhrase(before, " cannot provision")
            || ContainsPhrase(before, " should not provision ")
            || ContainsPhrase(before, " should not provision")
            || ContainsPhrase(before, " ought not provision ")
            || ContainsPhrase(before, " ought not provision")
            || ContainsPhrase(before, " will not maintain ")
            || ContainsPhrase(before, " will not maintain")
            || ContainsPhrase(before, " would not maintain ")
            || ContainsPhrase(before, " would not maintain")
            || ContainsPhrase(before, " shall not maintain ")
            || ContainsPhrase(before, " shall not maintain")
            || ContainsPhrase(before, " cannot maintain ")
            || ContainsPhrase(before, " cannot maintain")
            || ContainsPhrase(before, " should not maintain ")
            || ContainsPhrase(before, " should not maintain")
            || ContainsPhrase(before, " ought not maintain ")
            || ContainsPhrase(before, " ought not maintain")
            || ContainsPhrase(before, " will not ensure ")
            || ContainsPhrase(before, " will not ensure")
            || ContainsPhrase(before, " would not ensure ")
            || ContainsPhrase(before, " would not ensure")
            || ContainsPhrase(before, " shall not ensure ")
            || ContainsPhrase(before, " shall not ensure")
            || ContainsPhrase(before, " cannot ensure ")
            || ContainsPhrase(before, " cannot ensure")
            || ContainsPhrase(before, " should not ensure ")
            || ContainsPhrase(before, " should not ensure")
            || ContainsPhrase(before, " ought not ensure ")
            || ContainsPhrase(before, " ought not ensure")
            || ContainsPhrase(before, " ought not implement ")
            || ContainsPhrase(before, " ought not implement")
            || ContainsPhrase(before, " ought not enable ")
            || ContainsPhrase(before, " ought not enable")
            || ContainsPhrase(before, " ought not deploy ")
            || ContainsPhrase(before, " ought not deploy")
            || ContainsPhrase(before, " ought not adopt ")
            || ContainsPhrase(before, " ought not adopt")
            || ContainsPhrase(before, " ought not use ")
            || ContainsPhrase(before, " ought not use")
            || ContainsPhrase(before, " ought not have ")
            || ContainsPhrase(before, " ought not have")
            || ContainsPhrase(before, " should not implement ")
            || ContainsPhrase(before, " should not implement")
            || ContainsPhrase(before, " should not enable ")
            || ContainsPhrase(before, " should not enable")
            || ContainsPhrase(before, " should not deploy ")
            || ContainsPhrase(before, " should not deploy")
            || ContainsPhrase(before, " should not adopt ")
            || ContainsPhrase(before, " should not adopt")
            || ContainsPhrase(before, " should not use ")
            || ContainsPhrase(before, " should not use")
            || ContainsPhrase(before, " should not have ")
            || ContainsPhrase(before, " should not have")
            || ContainsPhrase(before, " need not apply ")
            || ContainsPhrase(before, " need not apply")
            || ContainsPhrase(before, " need not provision ")
            || ContainsPhrase(before, " need not provision")
            || ContainsPhrase(before, " need not configure ")
            || ContainsPhrase(before, " need not configure")
            || ContainsPhrase(before, " need not enforce ")
            || ContainsPhrase(before, " need not enforce")
            || ContainsPhrase(before, " need not maintain ")
            || ContainsPhrase(before, " need not maintain")
            || ContainsPhrase(before, " need not mandate ")
            || ContainsPhrase(before, " need not mandate")
            || ContainsPhrase(before, " need not ensure ")
            || ContainsPhrase(before, " need not ensure")
            || ContainsPhrase(before, " need not require ")
            || ContainsPhrase(before, " need not require")
            || ContainsPhrase(before, " need not deploy ")
            || ContainsPhrase(before, " need not deploy")
            || ContainsPhrase(before, " need not adopt ")
            || ContainsPhrase(before, " need not adopt")
            || ContainsPhrase(before, " need not implement ")
            || ContainsPhrase(before, " need not implement")
            || ContainsPhrase(before, " need not enable ")
            || ContainsPhrase(before, " need not enable")
            || ContainsPhrase(before, " need not use ")
            || ContainsPhrase(before, " need not use")
            || ContainsPhrase(before, " need not have ")
            || ContainsPhrase(before, " need not have")
            || ContainsPhrase(before, " shouldn't require ")
            || ContainsPhrase(before, " shouldn't require")
            || ContainsPhrase(before, " won't require ")
            || ContainsPhrase(before, " won't require")
            || ContainsPhrase(before, " shouldn't need ")
            || ContainsPhrase(before, " shouldn't need")
            || ContainsPhrase(before, " won't need ")
            || ContainsPhrase(before, " won't need")
            || ContainsPhrase(before, " shouldn't enforce ")
            || ContainsPhrase(before, " shouldn't enforce")
            || ContainsPhrase(before, " won't enforce ")
            || ContainsPhrase(before, " won't enforce")
            || ContainsPhrase(before, " shouldn't apply ")
            || ContainsPhrase(before, " shouldn't apply")
            || ContainsPhrase(before, " won't apply ")
            || ContainsPhrase(before, " won't apply")
            || ContainsPhrase(before, " shouldn't configure ")
            || ContainsPhrase(before, " shouldn't configure")
            || ContainsPhrase(before, " won't configure ")
            || ContainsPhrase(before, " won't configure")
            || ContainsPhrase(before, " shouldn't mandate ")
            || ContainsPhrase(before, " shouldn't mandate")
            || ContainsPhrase(before, " won't mandate ")
            || ContainsPhrase(before, " won't mandate")
            || ContainsPhrase(before, " shouldn't maintain ")
            || ContainsPhrase(before, " shouldn't maintain")
            || ContainsPhrase(before, " won't maintain ")
            || ContainsPhrase(before, " won't maintain")
            || ContainsPhrase(before, " shouldn't ensure ")
            || ContainsPhrase(before, " shouldn't ensure")
            || ContainsPhrase(before, " won't ensure ")
            || ContainsPhrase(before, " won't ensure")
            || ContainsPhrase(before, " shouldn't provision ")
            || ContainsPhrase(before, " shouldn't provision")
            || ContainsPhrase(before, " won't provision ")
            || ContainsPhrase(before, " won't provision")
            || ContainsPhrase(before, " shouldn't deploy ")
            || ContainsPhrase(before, " shouldn't deploy")
            || ContainsPhrase(before, " won't deploy ")
            || ContainsPhrase(before, " won't deploy")
            || ContainsPhrase(before, " shouldn't adopt ")
            || ContainsPhrase(before, " shouldn't adopt")
            || ContainsPhrase(before, " won't adopt ")
            || ContainsPhrase(before, " won't adopt")
            || ContainsPhrase(before, " shouldn't implement ")
            || ContainsPhrase(before, " shouldn't implement")
            || ContainsPhrase(before, " won't implement ")
            || ContainsPhrase(before, " won't implement")
            || ContainsPhrase(before, " shouldn't enable ")
            || ContainsPhrase(before, " shouldn't enable")
            || ContainsPhrase(before, " won't enable ")
            || ContainsPhrase(before, " won't enable")
            || ContainsPhrase(before, " shouldn't use ")
            || ContainsPhrase(before, " shouldn't use")
            || ContainsPhrase(before, " won't use ")
            || ContainsPhrase(before, " won't use")
            || ContainsPhrase(before, " shouldn't have ")
            || ContainsPhrase(before, " shouldn't have")
            || ContainsPhrase(before, " won't have ")
            || ContainsPhrase(before, " won't have")
            || ContainsPhrase(before, " doesn't implement ")
            || ContainsPhrase(before, " doesn't implement")
            || ContainsPhrase(before, " doesn't enable ")
            || ContainsPhrase(before, " doesn't enable")
            || ContainsPhrase(before, " doesn't deploy ")
            || ContainsPhrase(before, " doesn't deploy")
            || ContainsPhrase(before, " doesn't adopt ")
            || ContainsPhrase(before, " doesn't adopt")
            || ContainsPhrase(before, " doesn't apply ")
            || ContainsPhrase(before, " doesn't apply")
            || ContainsPhrase(before, " doesn't configure ")
            || ContainsPhrase(before, " doesn't configure")
            || ContainsPhrase(before, " doesn't mandate ")
            || ContainsPhrase(before, " doesn't mandate")
            || ContainsPhrase(before, " doesn't maintain ")
            || ContainsPhrase(before, " doesn't maintain")
            || ContainsPhrase(before, " doesn't enforce ")
            || ContainsPhrase(before, " doesn't enforce")
            || ContainsPhrase(before, " doesn't ensure ")
            || ContainsPhrase(before, " doesn't ensure")
            || ContainsPhrase(before, " doesn't provision ")
            || ContainsPhrase(before, " doesn't provision")
            || ContainsPhrase(before, " doesn't use ")
            || ContainsPhrase(before, " doesn't use")
            || ContainsPhrase(before, " doesn't have ")
            || ContainsPhrase(before, " doesn't have")
            || ContainsPhrase(before, " cannot implement ")
            || ContainsPhrase(before, " cannot implement")
            || ContainsPhrase(before, " cannot enable ")
            || ContainsPhrase(before, " cannot enable")
            || ContainsPhrase(before, " cannot use ")
            || ContainsPhrase(before, " cannot use")
            || ContainsPhrase(before, " cannot deploy ")
            || ContainsPhrase(before, " cannot deploy")
            || ContainsPhrase(before, " cannot adopt ")
            || ContainsPhrase(before, " cannot adopt")
            || ContainsPhrase(before, " cannot have ")
            || ContainsPhrase(before, " cannot have")
            || ContainsPhrase(before, " does not implement ")
            || ContainsPhrase(before, " does not implement")
            || ContainsPhrase(before, " does not enable ")
            || ContainsPhrase(before, " does not enable")
            || ContainsPhrase(before, " does not deploy ")
            || ContainsPhrase(before, " does not deploy")
            || ContainsPhrase(before, " does not adopt ")
            || ContainsPhrase(before, " does not adopt")
            || ContainsPhrase(before, " does not use ")
            || ContainsPhrase(before, " does not use")
            || ContainsPhrase(before, " does not have ")
            || ContainsPhrase(before, " does not have")
            || ContainsPhrase(before, " does not maintain ")
            || ContainsPhrase(before, " does not maintain")
            || ContainsPhrase(before, " does not mandate ")
            || ContainsPhrase(before, " does not mandate")
            || ContainsPhrase(before, " does not ensure ")
            || ContainsPhrase(before, " does not ensure")
            || ContainsPhrase(before, " does not provision ")
            || ContainsPhrase(before, " does not provision")
            || ContainsPhrase(before, " does not apply ")
            || ContainsPhrase(before, " does not apply")
            || ContainsPhrase(before, " does not configure ")
            || ContainsPhrase(before, " does not configure")
            || ContainsPhrase(before, " does not enforce ")
            || ContainsPhrase(before, " does not enforce")
            || ContainsPhrase(before, " does not require ")
            || ContainsPhrase(before, " does not require")
            || ContainsPhrase(before, " does not need ")
            || ContainsPhrase(before, " does not need")
            || ContainsPhrase(before, " will not implement ")
            || ContainsPhrase(before, " will not implement")
            || ContainsPhrase(before, " will not enable ")
            || ContainsPhrase(before, " will not enable")
            || ContainsPhrase(before, " will not deploy ")
            || ContainsPhrase(before, " will not deploy")
            || ContainsPhrase(before, " will not adopt ")
            || ContainsPhrase(before, " will not adopt")
            || ContainsPhrase(before, " will not use ")
            || ContainsPhrase(before, " will not use")
            || ContainsPhrase(before, " will not have ")
            || ContainsPhrase(before, " will not have")
            || ContainsPhrase(before, " would not implement ")
            || ContainsPhrase(before, " would not implement")
            || ContainsPhrase(before, " would not enable ")
            || ContainsPhrase(before, " would not enable")
            || ContainsPhrase(before, " would not deploy ")
            || ContainsPhrase(before, " would not deploy")
            || ContainsPhrase(before, " would not adopt ")
            || ContainsPhrase(before, " would not adopt")
            || ContainsPhrase(before, " would not use ")
            || ContainsPhrase(before, " would not use")
            || ContainsPhrase(before, " would not have ")
            || ContainsPhrase(before, " would not have")
            || ContainsPhrase(before, " shall not implement ")
            || ContainsPhrase(before, " shall not implement")
            || ContainsPhrase(before, " shall not enable ")
            || ContainsPhrase(before, " shall not enable")
            || ContainsPhrase(before, " shall not deploy ")
            || ContainsPhrase(before, " shall not deploy")
            || ContainsPhrase(before, " shall not adopt ")
            || ContainsPhrase(before, " shall not adopt")
            || ContainsPhrase(before, " shall not use ")
            || ContainsPhrase(before, " shall not use")
            || ContainsPhrase(before, " shall not have ")
            || ContainsPhrase(before, " shall not have")
            || ContainsPhrase(before, " must not ")
            || ContainsPhrase(before, " do not ")
            || ContainsPhrase(before, " doesn't require ")
            || ContainsPhrase(before, " doesn't need ")
            || ContainsPhrase(before, " cannot require ")
            || ContainsPhrase(before, " cannot need ")
            || ContainsPhrase(before, " cannot need");
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
