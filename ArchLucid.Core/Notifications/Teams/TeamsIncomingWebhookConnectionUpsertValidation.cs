namespace ArchLucid.Core.Notifications.Teams;

/// <summary>
///     Upsert validation for <c>dbo.TenantTeamsIncomingWebhookConnections</c> — keeps raw webhook URLs out of SQL.
/// </summary>
public static class TeamsIncomingWebhookConnectionUpsertValidation
{
    /// <summary>Returned when <see cref="TryValidateKeyVaultSecretName" /> rejects null/whitespace input.</summary>
    public const string KeyVaultSecretNameRequiredMessage = "KeyVaultSecretName is required.";

    /// <summary>Returned when the value looks like a URL instead of a Key Vault secret name reference.</summary>
    public const string RawWebhookUrlRejectedMessage =
        "KeyVaultSecretName must be a Key Vault secret name or id reference — raw webhook URLs are not stored in ArchLucid SQL.";

    /// <summary>
    ///     Validates <paramref name="keyVaultSecretName" /> for persistence (non-empty, no <c>://</c> URL shapes).
    /// </summary>
    public static bool TryValidateKeyVaultSecretName(
        string? keyVaultSecretName,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(keyVaultSecretName))
        {
            errorMessage = KeyVaultSecretNameRequiredMessage;

            return false;
        }

        trimmed = keyVaultSecretName.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            errorMessage = RawWebhookUrlRejectedMessage;

            return false;
        }

        return true;
    }
}
