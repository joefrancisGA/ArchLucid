namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Detects credential material inside non-sensitive configuration effective values (connection strings,
///     URI userinfo, and key/value pairs) without relying on a fixed delimiter whitelist.
/// </summary>
internal static class ConfigurationEmbeddedCredentialMaterialDetector
{
    private static readonly string[] CredentialKeyNames =
    [
        "SharedAccessKey",
        "ClientSecret",
        "client_secret",
        "AccountKey",
        "AccessKey",
        "ApiKey",
        "Password",
        "Pwd",
        "PWD",
        "Secret",
        "Token",
        "Sig",
    ];

    /// <summary>
    ///     Returns <see langword="true" /> when the value likely contains secrets (fail closed on ambiguous key/value shapes).
    /// </summary>
    public static bool ContainsEmbeddedCredentialMaterial(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        ReadOnlySpan<char> trimmed = value.AsSpan().Trim();

        if (trimmed.Length < 4)
            return false;

        if (ContainsUrlUserInfoCredentials(trimmed))
            return true;

        if (!trimmed.Contains('=') && !trimmed.Contains(':'))
            return false;

        return ContainsCredentialKeyValuePair(trimmed);
    }

    private static bool ContainsUrlUserInfoCredentials(ReadOnlySpan<char> trimmed)
    {
        if (ContainsSchemeLessUserInfoCredentials(trimmed))
            return true;

        int searchStart = 0;

        while (searchStart < trimmed.Length)
        {
            ReadOnlySpan<char> remainder = trimmed.Slice(searchStart);
            int schemeSeparator = remainder.IndexOf("://".AsSpan(), StringComparison.Ordinal);

            if (schemeSeparator < 0)
                return false;

            int authorityStart = searchStart + schemeSeparator + 3;
            ReadOnlySpan<char> authority = trimmed.Slice(authorityStart);
            int atOffset = authority.IndexOf('@');

            if (atOffset >= 0)
            {
                ReadOnlySpan<char> userInfo = authority.Slice(0, atOffset);

                if (userInfo.Contains(':'))
                    return true;
            }

            searchStart = searchStart + schemeSeparator + 1;
        }

        return false;
    }

    /// <summary>
    ///     Connection strings copied without a scheme (e.g. <c>user:pass@host:5432/db</c>) still embed credentials in userinfo.
    /// </summary>
    private static bool ContainsSchemeLessUserInfoCredentials(ReadOnlySpan<char> trimmed)
    {
        int atIndex = trimmed.IndexOf('@');

        if (atIndex <= 0)
            return false;

        ReadOnlySpan<char> beforeAt = trimmed.Slice(0, atIndex);

        if (beforeAt.Contains("://".AsSpan(), StringComparison.Ordinal))
            return false;

        int colonIndex = beforeAt.IndexOf(':');

        if (colonIndex < 0)
            return false;

        ReadOnlySpan<char> password = beforeAt.Slice(colonIndex + 1).Trim();

        return !password.IsEmpty;
    }

    private static bool ContainsCredentialKeyValuePair(ReadOnlySpan<char> trimmed)
    {
        for (int index = 0; index < trimmed.Length; index++)
        {

            if (!IsPairBoundaryBeforeIndex(trimmed, index))
                continue;

            if (TryMatchCredentialKeyValuePairAt(trimmed, index))
                return true;
        }

        return false;
    }

    private static bool IsPairBoundaryBeforeIndex(ReadOnlySpan<char> trimmed, int index)
    {
        if (index == 0)
            return true;

        int boundaryIndex = index;

        while (boundaryIndex > 0 && trimmed[boundaryIndex - 1] == ' ')
            boundaryIndex--;

        if (boundaryIndex == 0)
            return true;

        char previous = trimmed[boundaryIndex - 1];

        if (IsPairDelimiter(previous))
            return true;

        if (previous != ':')
            return false;

        if (boundaryIndex >= 3 && trimmed.Slice(boundaryIndex - 3, 3).Equals("://".AsSpan(), StringComparison.Ordinal))
            return false;

        return true;
    }

    private static bool IsPairDelimiter(char character) =>
        character is ';' or ',' or '|' or '&' or '\r' or '\n' or '\t' or '\f' or '\v'
        or '\u00A0' or '\u2009' or '\u202F' or '\u0085' or '\u2028' or '\u2029';

    private static bool TryMatchCredentialKeyValuePairAt(ReadOnlySpan<char> trimmed, int index)
    {
        ReadOnlySpan<char> rest = trimmed.Slice(index);

        foreach (string keyName in CredentialKeyNames)
        {

            if (!rest.StartsWith(keyName.AsSpan(), StringComparison.OrdinalIgnoreCase))
                continue;

            int afterKey = keyName.Length;

            if (afterKey < rest.Length && IsKeyContinuationCharacter(rest[afterKey]))
                continue;

            while (afterKey < rest.Length && char.IsWhiteSpace(rest[afterKey]))
                afterKey++;

            if (afterKey >= rest.Length)
                continue;

            if (rest[afterKey] is not ('=' or ':'))
                continue;

            if (!HasNonEmptyCredentialValue(rest, afterKey + 1))
            {
                // Fail closed: credential-shaped key with empty value still redacts.
                return true;
            }

            return true;
        }

        return false;
    }

    private static bool IsKeyContinuationCharacter(char character) =>
        char.IsLetterOrDigit(character) || character is '_' or '-';

    private static bool HasNonEmptyCredentialValue(ReadOnlySpan<char> rest, int valueStart)
    {
        int index = valueStart;

        while (index < rest.Length && char.IsWhiteSpace(rest[index]))
            index++;

        if (index >= rest.Length)
            return false;

        if (rest[index] is '"' or '\'')
        {
            char quote = rest[index];
            index++;

            while (index < rest.Length && rest[index] != quote)
                index++;

            return index > valueStart + 1;
        }

        while (index < rest.Length && !IsValueTerminator(rest, index))
            index++;

        return index > valueStart;
    }

    private static bool IsValueTerminator(ReadOnlySpan<char> rest, int index)
    {
        if (IsPairDelimiter(rest[index]))
            return true;

        if (rest[index] != ':')
            return false;

        if (index >= 3 && rest.Slice(index - 3, 3).Equals("://".AsSpan(), StringComparison.Ordinal))
            return false;

        return true;
    }
}
