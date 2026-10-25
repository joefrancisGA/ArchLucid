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
        "AccessToken",
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

        if (trimmed.Length > 0 && trimmed[0] == '\uFEFF')
            trimmed = trimmed.Slice(1).TrimStart();

        if (trimmed.Length < 4)
            return false;

        if (ContainsUrlUserInfoCredentials(trimmed))
            return true;

        if (!trimmed.Contains('=') && !trimmed.Contains(':') && !trimmed.Contains('%'))
            return false;

        if (ContainsCredentialKeyValuePair(trimmed))
            return true;

        return ContainsCredentialKeyValuePairAfterPercentDecoding(trimmed);
    }

    private static bool ContainsCredentialKeyValuePairAfterPercentDecoding(ReadOnlySpan<char> trimmed)
    {
        if (!trimmed.Contains('%'))
            return false;

        string current = trimmed.ToString();

        const int maxPercentDecodePasses = 4992;

        for (int pass = 0; pass < maxPercentDecodePasses && current.Contains('%'); pass++)
        {
            string decoded = Uri.UnescapeDataString(current);

            if (string.Equals(decoded, current, StringComparison.Ordinal))
                break;

            current = decoded;
            ReadOnlySpan<char> decodedTrimmed = current.AsSpan().Trim();

            if (decodedTrimmed.Length < 4)
                continue;

            if (ContainsUrlUserInfoCredentials(decodedTrimmed))
                return true;

            if (ContainsCredentialKeyValuePair(decodedTrimmed))
                return true;
        }

        return false;
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

        char previous = trimmed[index - 1];

        if (IsPairDelimiter(previous))
            return true;

        if (previous != ':')
            return false;

        if (index >= 3 && trimmed.Slice(index - 3, 3).Equals("://".AsSpan(), StringComparison.Ordinal))
            return false;

        return true;
    }

    private static bool IsPairDelimiter(char character) =>
        character is ';' or ',' or '|' or '&' or '?' or '/' or ' ' or '\\' or '\r' or '\n' or '\t' or '\f' or '\v'
        or '\u00A0' or '\u00AD' or '\u1680' or '\u180E' or '\u2000' or '\u2001' or '\u2002' or '\u2003' or '\u2004'
        or '\u2005' or '\u2006' or '\u2007' or '\u2008' or '\u2009' or '\u200A' or '\u200B' or '\u200C' or '\u200D'
        or '\u200E' or '\u200F' or '\u2011' or '\u2012' or '\u2013' or '\u2014' or '\u2015' or '\u202A' or '\u202B'
        or '\u202C' or '\u202D' or '\u202E' or '\u202F' or '\u205F' or '\u2060' or '\u2066' or '\u2067' or '\u2068'
        or '\u2069' or '\u206A' or '\u206B' or '\u206C' or '\u206D' or '\u206E' or '\u206F' or '\u3000' or '\uFE63' or '\uFF0D' or '\uFF0F'
        or '\u2044' or '\u2571' or '\u2572' or '\u29F8' or '\u29F9' or '\uFE00' or '\uFE01' or '\uFE02' or '\uFE03' or '\uFE04' or '\uFE05' or '\uFE06' or '\uFE07' or '\uFE08' or '\uFE09' or '\uFE0A' or '\uFE0B' or '\uFE0C' or '\uFE0D' or '\uFE0E' or '\uFE0F' or '\uFE31' or '\uFE32' or '\uFE68' or '\uFE69' or '\uFE6A' or '\uFE6B' or '\uFE6C' or '\uFE6D' or '\uFE6E' or '\uFE6F' or '\uFE70' or '\uFE71' or '\uFE72' or '\uFE73' or '\uFE74' or '\uFE75' or '\uFE76' or '\uFE77' or '\uFE78' or '\uFE79' or '\uFE7A' or '\uFE7B' or '\uFE7C' or '\uFE7D' or '\uFE7E' or '\uFE7F' or '\uFE80' or '\uFE81' or '\uFE82' or '\uFE83' or '\uFE84' or '\uFE85' or '\uFE86' or '\uFE87' or '\uFE88' or '\uFE89' or '\uFE8A' or '\uFE8B' or '\uFE8C' or '\uFE8D' or '\uFE8E' or '\uFE8F' or '\uFE90' or '\uFE91' or '\uFE92' or '\uFE93' or '\uFE94' or '\uFE95' or '\uFE96' or '\uFE97' or '\uFE98' or '\uFE99' or '\uFE9A' or '\uFE9B' or '\uFE9C' or '\uFE9D' or '\uFE9E' or '\uFE9F' or '\uFEFF' or '\uFF3C' or '\uFFE5' or '\uFFE6' or '\uFFFC' or '\uFFFD' or '\uFFF9' or '\uFFFA' or '\u2216' or '\u2212' or '\u2215' or '\u0085' or '\u2028' or '\u2029';

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
