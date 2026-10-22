using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     OIDC-specific activation guards for the Key Vault client-secret name pointer.
/// </summary>
internal static class IdentityProviderActivationOidcKeyVaultGuards
{
    internal static void EnsurePresentWhenRequired(
        TenantIdentityProtocol protocol,
        string? resolvedKeyVaultSecretName,
        bool requiresSubstantiveKeyVaultSecretName)
    {
        if (protocol != TenantIdentityProtocol.Oidc)
            return;

        if (!requiresSubstantiveKeyVaultSecretName)
            return;

        if (IdentityProviderSubstantiveTextValidation.HasSubstantiveText(resolvedKeyVaultSecretName))
            return;

        throw new ArgumentException("KeyVaultSecretName is required for OIDC activation.");
    }
}
