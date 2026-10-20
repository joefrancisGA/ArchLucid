using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     When protocol-specific persisted fields must be present on <see cref="IdentityProviderActivationService.ActivateAsync"/>.
/// </summary>
internal static class IdentityProviderActivationProtocolFieldRequirements
{
    /// <summary>
    ///     SAML SP metadata is required on first SAML configuration and on any cross-protocol switch to SAML.
    ///     Same-protocol reactivate may omit <c>MetadataXml</c> to preserve or whitespace-clear the stored value.
    /// </summary>
    internal static bool RequiresSubstantiveSamlMetadataXml(
        TenantIdentityProviderConfigurationRecord? existing,
        TenantIdentityProtocol targetProtocol)
    {
        if (targetProtocol != TenantIdentityProtocol.Saml)
            return false;

        return existing is null
            || existing.Protocol != TenantIdentityProtocol.Saml;
    }

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
