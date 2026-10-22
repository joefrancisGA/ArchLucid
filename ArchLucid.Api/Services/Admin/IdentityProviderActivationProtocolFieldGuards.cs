using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Protocol-specific persisted-field guards for tenant IdP activation.
/// </summary>
internal static class IdentityProviderActivationProtocolFieldGuards
{
    /// <summary>
    ///     Drops protocol-specific fields that do not apply to the activation target so stale wizard payloads
    ///     cannot persist SAML metadata on OIDC rows (or OIDC secret names on SAML rows).
    /// </summary>
    internal static void NormalizeResolvedFieldsForProtocol(
        TenantIdentityProtocol targetProtocol,
        ref string? resolvedMetadataXml,
        ref string? resolvedKeyVaultSecretName)
    {
        if (targetProtocol != TenantIdentityProtocol.Saml)
            resolvedMetadataXml = null;

        if (targetProtocol != TenantIdentityProtocol.Oidc)
            resolvedKeyVaultSecretName = null;
    }

    internal static void EnsureActivateFields(
        TenantIdentityProtocol targetProtocol,
        string? resolvedMetadataXml,
        string? resolvedKeyVaultSecretName,
        TenantIdentityProviderConfigurationRecord? existing)
    {
        IdentityProviderActivationSamlMetadataGuards.EnsurePresentWhenRequired(
            targetProtocol,
            resolvedMetadataXml,
            IdentityProviderActivationProtocolFieldRequirements.RequiresSubstantiveSamlMetadataXml(
                existing,
                targetProtocol));

        IdentityProviderActivationSamlMetadataGuards.EnsureValidWhenProvided(targetProtocol, resolvedMetadataXml);

        IdentityProviderActivationOidcKeyVaultGuards.EnsurePresentWhenRequired(
            targetProtocol,
            resolvedKeyVaultSecretName,
            IdentityProviderActivationProtocolFieldRequirements.RequiresSubstantiveOidcKeyVaultSecretName(
                existing,
                targetProtocol));
    }
}
