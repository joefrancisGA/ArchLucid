namespace ArchLucid.Core.Identity;

public static class IdentityIssuerNormalizer
{
    public static string Normalize(string issuer)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(issuer);

        string normalized = issuer.Trim().TrimEnd('/');
        // Slash-only values are nonblank before normalization but collapse to
        // an empty identity issuer and must never become a persisted key.
        ArgumentException.ThrowIfNullOrWhiteSpace(normalized, nameof(issuer));

        return normalized.ToLowerInvariant();
    }

    public static string NormalizeMicrosoftEntraIssuer(Guid entraTenantId)
    {
        return Normalize(
            $"{IdentityIssuerConstants.MicrosoftLoginOnlinePrefix}{entraTenantId:D}{IdentityIssuerConstants.MicrosoftLoginOnlineSuffix}");
    }
}
