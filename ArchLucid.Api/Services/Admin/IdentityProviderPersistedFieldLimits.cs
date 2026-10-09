namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Column widths for <c>dbo.TenantIdentityProviderConfigurations</c> (migration 183).
///     Activation must reject longer values before SQL MERGE, which fails closed on truncation.
/// </summary>
internal static class IdentityProviderPersistedFieldLimits
{
    internal const int IssuerUriMaxLength = 2048;

    internal const int KeyVaultSecretNameMaxLength = 256;

    internal const int UpdatedByActorIdMaxLength = 256;

    internal static void EnsureIssuerUriFits(string canonicalIssuerUri)
    {
        ArgumentNullException.ThrowIfNull(canonicalIssuerUri);

        if (canonicalIssuerUri.Length > IssuerUriMaxLength)
        {
            throw new ArgumentException(
                $"IssuerUri must be at most {IssuerUriMaxLength} characters.");
        }
    }

    internal static void EnsureKeyVaultSecretNameFits(string? keyVaultSecretName)
    {
        if (keyVaultSecretName is null)
            return;

        if (keyVaultSecretName.Length > KeyVaultSecretNameMaxLength)
        {
            throw new ArgumentException(
                $"KeyVaultSecretName must be at most {KeyVaultSecretNameMaxLength} characters.");
        }
    }

    internal static void EnsureUpdatedByActorIdFits(string actorId)
    {
        ArgumentNullException.ThrowIfNull(actorId);

        if (actorId.Length > UpdatedByActorIdMaxLength)
        {
            throw new ArgumentException(
                $"actorId must be at most {UpdatedByActorIdMaxLength} characters.",
                nameof(actorId));
        }
    }
}
