namespace ArchLucid.Core.Text;

/// <summary>
///     Detects closed-class English negation in architect constraint and advice text.
/// </summary>
public static class EnglishNegationTokenizer
{
    private static readonly string[] MultiWordNegations =
    [
        // Modal / auxiliary + "not". Closed class: English has no productive rule for adding
        // more, so this list is complete rather than a sample to be extended per finding.
        "am not",
        "are not",
        "can not",
        "cannot",
        "could not",
        "dare not",
        "did not",
        "do not",
        "does not",
        "had not",
        "has not",
        "have not",
        "is not",
        "may not",
        "might not",
        "must not",
        "need not",
        "ought not",
        "shall not",
        "should not",
        "was not",
        "were not",
        "will not",
        "would not",
    ];

    // The complete set of English negative contractions. Adding a phrase here is only correct
    // when the language gains a contraction; it is not the place to record a missed finding.
    private static readonly string[] ContractionNegations =
    [
        "ain't",
        "aren't",
        "can't",
        "couldn't",
        "daren't",
        "didn't",
        "doesn't",
        "don't",
        "hadn't",
        "hasn't",
        "haven't",
        "isn't",
        "mayn't",
        "mightn't",
        "mustn't",
        "needn't",
        "oughtn't",
        "shan't",
        "shouldn't",
        "wasn't",
        "weren't",
        "won't",
        "wouldn't",
    ];

    private static readonly string[] SingleWordNegations =
    [
        "never",
        "cannot",
    ];

    private static readonly string[] SuffixNegations =
    [
        "not",
        "no",
        "without",
        "avoid",
        "avoids",
    ];

    // "no"/"not" carries the negation; the requirement head follows it. Enumerating the trailing
    // preposition as well ("not required to" vs "not required for") multiplies out into a phrase
    // list, so the negator and head are matched as a pair and anything after them is ignored.
    private static readonly string[] RequirementNegators =
    [
        "not",
        "no",
    ];

    private static readonly string[] RequirementHeads =
    [
        "mandatory",
        "necessary",
        "need",
        "needed",
        "obligatory",
        "required",
        "requirement",
        "requirements",
    ];

    public static bool ContainsNegation(ReadOnlySpan<char> text)
    {
        if (text.IsEmpty)
        {
            return false;
        }

        foreach (string phrase in MultiWordNegations)
        {
            if (ContainsPhraseAtWordBoundary(text, phrase))
            {
                return true;
            }
        }

        foreach (string contraction in ContractionNegations)
        {
            if (ContainsWordToken(text, contraction))
            {
                return true;
            }
        }

        foreach (string word in SingleWordNegations)
        {
            if (ContainsWordToken(text, word))
            {
                return true;
            }
        }

        foreach (string suffix in SuffixNegations)
        {
            if (EndsWithWordToken(text, suffix))
            {
                return true;
            }
        }

        return ContainsNegatedRequirement(text);
    }

    private static bool ContainsNegatedRequirement(ReadOnlySpan<char> text)
    {
        foreach (string negator in RequirementNegators)
        {
            if (IsNegatorFollowedByRequirementHead(text, negator))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsNegatorFollowedByRequirementHead(ReadOnlySpan<char> haystack, string negator)
    {
        int index = 0;

        while (index < haystack.Length)
        {
            ReadOnlySpan<char> slice = haystack.Slice(index);
            int relative = slice.IndexOf(negator.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (relative < 0)
            {
                return false;
            }

            int found = index + relative;

            if (IsStandaloneWordToken(haystack, found, negator.Length)
                && IsRequirementHead(NextWord(haystack, found + negator.Length)))
            {
                return true;
            }

            index = found + 1;
        }

        return false;
    }

    private static ReadOnlySpan<char> NextWord(ReadOnlySpan<char> haystack, int startIndex)
    {
        int start = startIndex;

        while (start < haystack.Length && !char.IsLetter(haystack[start]))
        {
            start++;
        }

        int end = start;

        while (end < haystack.Length && char.IsLetter(haystack[end]))
        {
            end++;
        }

        return haystack.Slice(start, end - start);
    }

    private static bool IsRequirementHead(ReadOnlySpan<char> word)
    {
        if (word.IsEmpty)
        {
            return false;
        }

        foreach (string head in RequirementHeads)
        {
            if (word.Equals(head.AsSpan(), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool ContainsPhraseAtWordBoundary(ReadOnlySpan<char> haystack, string phrase)
    {
        int index = 0;

        while (index < haystack.Length)
        {
            ReadOnlySpan<char> slice = haystack.Slice(index);
            int relative = slice.IndexOf(phrase.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (relative < 0)
            {
                return false;
            }

            int found = index + relative;
            bool okBefore = found == 0 || !char.IsLetter(haystack[found - 1]);
            int after = found + phrase.Length;
            bool okAfter = after >= haystack.Length || !char.IsLetter(haystack[after]);

            if (okBefore && okAfter)
            {
                return true;
            }

            index = found + 1;
        }

        return false;
    }

    private static bool ContainsWordToken(ReadOnlySpan<char> haystack, string token)
    {
        int index = 0;

        while (index < haystack.Length)
        {
            ReadOnlySpan<char> slice = haystack.Slice(index);
            int relative = slice.IndexOf(token.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (relative < 0)
            {
                return false;
            }

            int found = index + relative;

            if (IsStandaloneWordToken(haystack, found, token.Length))
            {
                return true;
            }

            index = found + 1;
        }

        return false;
    }

    private static bool EndsWithWordToken(ReadOnlySpan<char> haystack, string token)
    {
        ReadOnlySpan<char> trimmed = haystack.TrimEnd();

        if (trimmed.Length < token.Length)
        {
            return false;
        }

        int start = trimmed.Length - token.Length;

        // A word-boundary check alone accepts any trailing word of the same length, which read
        // "might require NAT" as ending in "not", so compare the characters before trusting it.
        if (!trimmed.Slice(start).Equals(token.AsSpan(), StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return IsStandaloneWordToken(trimmed, start, token.Length);
    }

    private static bool IsStandaloneWordToken(ReadOnlySpan<char> haystack, int tokenIndex, int tokenLength)
    {
        bool okBefore = tokenIndex == 0 || !char.IsLetter(haystack[tokenIndex - 1]);
        int afterToken = tokenIndex + tokenLength;
        bool okAfter = afterToken >= haystack.Length || !char.IsLetter(haystack[afterToken]);

        return okBefore && okAfter;
    }
}
