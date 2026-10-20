using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Protocol-specific persisted-field guards for tenant IdP activation.
/// </summary>
internal static class IdentityProviderActivationProtocolFieldGuards
{
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
