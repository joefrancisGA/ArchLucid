namespace ArchLucid.Core.Security;

/// <summary>
///     Detects secret-like configuration segments and ARM property keys using a closed token vocabulary.
/// </summary>
public static class SensitiveCredentialNameMatcher
{
    private static readonly HashSet<string> SensitiveSingleTokens = new(StringComparer.Ordinal)
    {
        "password",
        "secret",
        "token",
    };

    private static readonly (string First, string Second)[] SensitivePairs =
    [
        ("access", "key"),
        ("account", "key"),
        ("api", "key"),
        ("private", "key"),
        ("primary", "key"),
        ("secondary", "key"),
        ("signing", "key"),
        ("connection", "string"),
        ("connection", "strings"),
        ("client", "secret"),
        ("certificate", "password"),
        ("certificate", "thumbprint"),
        ("certificate", "pem"),
        ("certificate", "pfx"),
        ("certificate", "path"),
        ("signing", "certificate"),
    ];

    private static readonly (string First, string Second, string Third)[] SensitiveTriples =
    [
        ("shared", "access", "key"),
    ];

    public static bool IsSensitiveCredentialName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        IReadOnlyList<string> tokens = SensitiveNameTokenizer.Tokenize(name);

        if (tokens.Count == 0)
        {
            return false;
        }

        if (ContainsSensitiveSingleToken(tokens))
        {
            return true;
        }

        if (ContainsSensitivePair(tokens))
        {
            return true;
        }

        if (ContainsSensitiveTriple(tokens))
        {
            return true;
        }

        return false;
    }

    private static bool ContainsSensitiveSingleToken(IReadOnlyList<string> tokens)
    {
        foreach (string token in tokens)
        {
            if (SensitiveSingleTokens.Contains(token))
            {
                return true;
            }
        }

        return false;
    }

    private static bool ContainsSensitivePair(IReadOnlyList<string> tokens)
    {
        if (tokens.Count < 2)
        {
            return false;
        }

        for (int index = 0; index < tokens.Count - 1; index++)
        {
            string first = tokens[index];
            string second = tokens[index + 1];

            foreach ((string pairFirst, string pairSecond) in SensitivePairs)
            {
                if (first == pairFirst && second == pairSecond)
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool ContainsSensitiveTriple(IReadOnlyList<string> tokens)
    {
        if (tokens.Count < 3)
        {
            return false;
        }

        for (int index = 0; index < tokens.Count - 2; index++)
        {
            string first = tokens[index];
            string second = tokens[index + 1];
            string third = tokens[index + 2];

            foreach ((string tripleFirst, string tripleSecond, string tripleThird) in SensitiveTriples)
            {
                if (first == tripleFirst && second == tripleSecond && third == tripleThird)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
