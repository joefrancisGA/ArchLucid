namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Azure and azurerm emit <c>TLS1_2</c>. The declaration parser lowercases that to <c>tls1_2</c>.
///     Older literals used <c>1.2</c> and <c>1.3</c>.
/// </summary>
internal static class DeclarationMinimumTlsVersion
{
    public static bool IsBelowTls12(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string normalized = Normalize(value);

        if (IsTls12OrNewer(normalized))
            return false;

        return true;
    }

    private static string Normalize(string value)
    {
        return value.Trim()
            .ToLowerInvariant()
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal);
    }

    private static bool IsTls12OrNewer(string normalized)
    {
        return normalized is "1.2" or "1.3" or "tls1.2" or "tls1.3" or "tls12" or "tls13";
    }
}
