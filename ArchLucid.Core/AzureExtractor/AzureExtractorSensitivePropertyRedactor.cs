namespace ArchLucid.Core.AzureExtractor;

/// <summary>Redacts secret-like ARM property keys before persistence or hashing.</summary>
public static class AzureExtractorSensitivePropertyRedactor
{
    private static readonly string[] SensitiveKeyFragments =
    [
        "secret",
        "password",
        "connectionstring",
        "privatekey",
        "certificate",
        "accesskey",
        "accountkey",
        "clientsecret",
        "primarykey",
        "secondarykey",
    ];

    public static bool IsSensitiveKey(string? propertyKey)
    {
        if (string.IsNullOrWhiteSpace(propertyKey))
            return false;

        string normalized = propertyKey.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .ToLowerInvariant();

        foreach (string fragment in SensitiveKeyFragments)
        {
            if (ContainsSensitiveFragment(normalized, fragment))
                return true;
        }

        return false;
    }

    private static bool ContainsSensitiveFragment(string normalized, string fragment)
    {
        int index = 0;

        while (index < normalized.Length)
        {
            index = normalized.IndexOf(fragment, index, StringComparison.Ordinal);

            if (index < 0)
                return false;

            if (!IsNegatedSensitiveFragment(normalized, index, fragment)
                && !IsEmbeddedSensitiveFragment(normalized, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsNegatedSensitiveFragment(string normalized, int fragmentIndex, string fragment)
    {
        if (IsNonPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (IsNoPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (IsUnPrefixedNegation(normalized, fragmentIndex))
            return true;

        if (fragmentIndex == 0
            && normalized.Length > fragment.Length
            && (normalized.AsSpan(fragment.Length).StartsWith("less", StringComparison.Ordinal)
                || normalized.AsSpan(fragment.Length).StartsWith("free", StringComparison.Ordinal)
                || normalized.AsSpan(fragment.Length).StartsWith("izer", StringComparison.Ordinal)))
            return true;

        return false;
    }

    private static bool IsEmbeddedSensitiveFragment(string normalized, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(normalized[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNonPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 3)
            return false;

        return before.EndsWith("non", StringComparison.Ordinal);
    }

    private static bool IsNoPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("no", StringComparison.Ordinal);
    }

    private static bool IsUnPrefixedNegation(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("un", StringComparison.Ordinal);
    }

    public static string RedactValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : "[REDACTED]";
}
