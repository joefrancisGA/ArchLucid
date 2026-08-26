namespace ArchLucid.Core.Findings;

/// <summary>
///     Logical declaration-security property names used by <see cref="DeclarationSecurityPropertyKeyResolver" />.
/// </summary>
public static class DeclarationSecurityPropertyLogicalNames
{
    public const string PublicNetworkAccess = nameof(PublicNetworkAccess);

    public const string AllowBlobPublicAccess = nameof(AllowBlobPublicAccess);

    public const string HttpsOnly = nameof(HttpsOnly);

    public const string MinimumTlsVersion = nameof(MinimumTlsVersion);

    public const string SslEnforcementEnabled = nameof(SslEnforcementEnabled);

    public const string IngressBlob = nameof(IngressBlob);
}
