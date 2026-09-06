namespace ArchLucid.Core.Text;

/// <summary>
///     Detects closed-class English negation in architect constraint and advice text.
/// </summary>
public static class EnglishNegationTokenizer
{
    private static readonly string[] MultiWordNegations =
    [
        "no need to",
        "no requirement to",
        "not required to",
        "not needed to",
        "is not required to",
        "is not needed to",
        "is not necessary for",
        "is not needed for",
        "no need for",
        "not needed for",
        "not necessary for",
        "must not",
        "should not",
        "shall not",
        "will not",
        "would not",
        "ought not",
        "do not",
        "does not",
        "did not",
        "can not",
        "cannot",
        "could not",
        "need not",
        "might not",
        "have not",
        "has not",
        "had not",
        "is not",
        "are not",
        "was not",
        "were not",
    ];

    private static readonly string[] ContractionNegations =
    [
        "mustn't",
        "shouldn't",
        "shan't",
        "won't",
        "wouldn't",
        "couldn't",
        "mightn't",
        "needn't",
        "don't",
        "doesn't",
        "didn't",
        "can't",
        "isn't",
        "aren't",
        "wasn't",
        "weren't",
        "hasn't",
        "haven't",
        "hadn't",
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
