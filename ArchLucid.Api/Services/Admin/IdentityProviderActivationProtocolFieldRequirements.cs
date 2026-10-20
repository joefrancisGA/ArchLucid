using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     When protocol-specific persisted fields must be present on <see cref="IdentityProviderActivationService.ActivateAsync"/>.
/// </summary>
internal static class IdentityProviderActivationProtocolFieldRequirements
{
    /// <summary>
    ///     Every SAML activation must persist substantive metadata after optional-field resolution.
    ///     Omitted same-protocol reactivate preserves the stored row; whitespace-only input must not clear it.
    /// </summary>
    internal static bool RequiresSubstantiveSamlMetadataXml(
        TenantIdentityProviderConfigurationRecord? existing,
        TenantIdentityProtocol targetProtocol) =>
        targetProtocol == TenantIdentityProtocol.Saml;

    /// <summary>
    ///     OIDC client-secret Key Vault name is required on cross-protocol switch to OIDC.
    ///     Greenfield OIDC may omit the name until a follow-up activation; same-protocol reactivate preserves null.
    /// </summary>
    internal static bool RequiresSubstantiveOidcKeyVaultSecretName(
        TenantIdentityProviderConfigurationRecord? existing,
        TenantIdentityProtocol targetProtocol)
    {
        if (targetProtocol != TenantIdentityProtocol.Oidc)
            return false;

        return existing is not null
            && existing.Protocol != TenantIdentityProtocol.Oidc;
    }
}
