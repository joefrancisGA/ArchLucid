using ArchLucid.Core.Text;

namespace ArchLucid.Core.Requests;

/// <summary>
///     Standalone token matching for free-text architecture constraints and capabilities.
/// </summary>
internal static class RequestConstraintTokenMatcher
{
    internal static bool ContainsAffirmativePhrase(string? haystack, string phrase)
    {
        haystack = NormalizeNegationText(haystack);

        if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(phrase))
            return false;

        int index = 0;

        while (index < haystack.Length)
        {
            index = haystack.IndexOf(phrase, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (!IsNegatedPhrasePrefix(haystack, index)
                && !IsNegatedPhraseSuffix(haystack, index, phrase.Length)
                && !IsEmbeddedInCompoundIdentifier(haystack, index, phrase.Length))
                return true;

            index++;
        }

        return false;
    }

    internal static bool ContainsStandaloneWordToken(string? haystack, string token)
    {
        haystack = NormalizeNegationText(haystack);

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
        haystack = NormalizeNegationText(haystack);

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

        if (!okBefore || !okAfter)
            return false;

        if (IsEmbeddedInCompoundIdentifier(haystack, tokenIndex, tokenLength))
            return false;

        return true;
    }

    private static bool IsEmbeddedInCompoundIdentifier(string haystack, int tokenIndex, int tokenLength)
    {
        if (HasHyphenOrUnderscoreCompoundBoundaries(haystack, tokenIndex, tokenLength))
            return true;

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
            return false;

        char connector = haystack[tokenIndex - 1];

        if (!IsCompoundIdentifierDelimiter(connector))
            return false;

        return char.IsLetterOrDigit(haystack[tokenIndex - 2]);
    }

    private static bool HasAlphanumericAfterConnector(string haystack, int afterToken)
    {
        if (afterToken + 1 >= haystack.Length)
            return false;

        char connector = haystack[afterToken];

        if (!IsCompoundIdentifierDelimiter(connector))
            return false;

        return char.IsLetterOrDigit(haystack[afterToken + 1]);
    }

    private static bool IsCompoundIdentifierDelimiter(char connector)
    {
        return connector is '-' or '_' or '.' or '/' or ':' or '\\';
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

        return EnglishNegationTokenizer.ContainsNegation(before);
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
        ReadOnlySpan<char> immediateSuffix = ImmediateSuffixBeforeSubordinateClause(after);

        if (immediateSuffix.Length >= 2 && ImmediateSuffixIndicatesNegation(immediateSuffix))
            return true;

        ReadOnlySpan<char> subordinateClause = SubordinateClauseSuffix(after);

        if (subordinateClause.IsEmpty)
            return false;

        if (ObjectRequirementRelativeClause(subordinateClause))
            return false;

        return EnglishNegationTokenizer.ContainsNegation(subordinateClause);
    }

    private static bool ImmediateSuffixIndicatesNegation(ReadOnlySpan<char> immediateSuffix)
    {
        if (immediateSuffix.StartsWith("not required", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("not needed", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("not necessary", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("is not required", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("is not needed", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("is not necessary", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("is unnecessary", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("isn't required", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("isn't needed", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("is optional", StringComparison.OrdinalIgnoreCase)
            || immediateSuffix.StartsWith("need not", StringComparison.OrdinalIgnoreCase))
            return true;

        if (ContainsPhrase(immediateSuffix, " need not "))
            return true;

        return EnglishNegationTokenizer.ContainsNegation(immediateSuffix);
    }

    private static ReadOnlySpan<char> SubordinateClauseSuffix(ReadOnlySpan<char> after)
    {
        ReadOnlySpan<char> immediateSuffix = ImmediateSuffixBeforeSubordinateClause(after);

        if (immediateSuffix.Length >= after.Length)
            return ReadOnlySpan<char>.Empty;

        return after.Slice(immediateSuffix.Length);
    }

    private static bool ObjectRequirementRelativeClause(ReadOnlySpan<char> subordinateClause)
    {
        ReadOnlySpan<char> trimmed = subordinateClause.TrimStart();

        ReadOnlySpan<string> patterns =
        [
            "that does not require",
            "that do not require",
            "that did not require",
            "which does not require",
            "which do not require",
            "which did not require",
            "that must not require",
            "that should not require",
            "that shall not require",
            "that need not require",
            "that will not require",
            "that would not require",
            "that ought not require",
        ];

        foreach (string pattern in patterns)
        {
            if (trimmed.StartsWith(pattern, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static ReadOnlySpan<char> ImmediateSuffixBeforeSubordinateClause(ReadOnlySpan<char> suffix)
    {
        ReadOnlySpan<string> introducers =
        [
            " that ",
            " which ",
            " where ",
            " when ",
            " who ",
            " whom ",
            " whose ",
        ];

        int boundary = suffix.Length;

        foreach (string introducer in introducers)
        {
            int index = suffix.IndexOf(introducer.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (index >= 0 && index < boundary)
                boundary = index;
        }

        ReadOnlySpan<string> leadingIntroducers =
        [
            "that ",
            "which ",
            "where ",
            "when ",
            "who ",
            "whom ",
            "whose ",
        ];

        foreach (string leadingIntroducer in leadingIntroducers)
        {
            if (suffix.StartsWith(leadingIntroducer.AsSpan(), StringComparison.OrdinalIgnoreCase))
            {
                boundary = 0;

                break;
            }
        }

        return suffix.Slice(0, boundary);
    }

    private static string? NormalizeNegationText(string? haystack)
    {
        if (string.IsNullOrWhiteSpace(haystack))
            return haystack;

        if (haystack.IndexOf('\u2019') < 0
            && haystack.IndexOf('\u2018') < 0
            && haystack.IndexOf('\u2032') < 0)
            return haystack;

        return haystack
            .Replace('\u2019', '\'')
            .Replace('\u2018', '\'')
            .Replace('\u2032', '\'');
    }
}
