namespace ArchLucid.Core.Security;

/// <summary>
///     Splits configuration keys and ARM property names into lowercase tokens for credential matching.
/// </summary>
public static class SensitiveNameTokenizer
{
    private static readonly char[] Delimiters = ['-', '_', '.', ':', '/'];

    public static IReadOnlyList<string> Tokenize(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Array.Empty<string>();
        }

        List<string> tokens = new();

        foreach (string part in name.Split(Delimiters, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            AppendCamelCaseTokens(part, tokens);
        }

        return tokens;
    }

    private static void AppendCamelCaseTokens(string part, List<string> tokens)
    {
        if (part.Length == 0)
        {
            return;
        }

        int start = 0;

        for (int index = 1; index < part.Length; index++)
        {
            if (!char.IsUpper(part[index]))
            {
                continue;
            }

            char previous = part[index - 1];

            if (char.IsLower(previous)
                || (index + 1 < part.Length && char.IsLower(part[index + 1])))
            {
                tokens.Add(part.Substring(start, index - start).ToLowerInvariant());
                start = index;
            }
        }

        tokens.Add(part.Substring(start).ToLowerInvariant());
    }
}
