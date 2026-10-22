namespace ArchLucid.Core.Identity;

public static class IdentityIssuerNormalizer
{
    public static string Normalize(string issuer)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(issuer);

        return issuer.Trim().TrimEnd('/').ToLowerInvariant();
    }

    public static string NormalizeMicrosoftEntraIssuer(Guid entraTenantId)
    {
        return Normalize(
            $"{IdentityIssuerConstants.MicrosoftLoginOnlinePrefix}{entraTenantId:D}{IdentityIssuerConstants.MicrosoftLoginOnlineSuffix}");
    }
}
