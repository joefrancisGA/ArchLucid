using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Core.Integrations.Itsm;

public static partial class TenantItsmConnectorConnectionUpsertValidation
{
    public static bool TryBuildUpsertCommandForProvider(
        TenantItsmConnectorProvider provider,
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? oauthClientIdKeyVaultSecretName,
        string? oauthClientSecretKeyVaultSecretName,
        string? oauthRefreshTokenKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        if (provider is TenantItsmConnectorProvider.AzureBoards)
            return TryBuildAzureBoardsUpsertCommand(
                instanceBaseUrl,
                authModeRaw,
                authUserName,
                credentialKeyVaultSecretName,
                inboundWebhookKeyVaultSecretName,
                isEnabled,
                label,
                out command,
                out errorMessage);

        return TryBuildUpsertCommand(
            instanceBaseUrl,
            authModeRaw,
            authUserName,
            credentialKeyVaultSecretName,
            oauthClientIdKeyVaultSecretName,
            oauthClientSecretKeyVaultSecretName,
            oauthRefreshTokenKeyVaultSecretName,
            inboundWebhookKeyVaultSecretName,
            isEnabled,
            label,
            out command,
            out errorMessage);
    }

    public static bool TryBuildUpsertCommand(
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? oauthClientIdKeyVaultSecretName,
        string? oauthClientSecretKeyVaultSecretName,
        string? oauthRefreshTokenKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        command = null;
        errorMessage = null;

        if (!TryValidateInstanceBaseUrl(instanceBaseUrl, out string? trimmedInstanceBaseUrl, out errorMessage))
            return false;

        if (!TryParseAuthMode(authModeRaw, out ItsmConnectorAuthMode authMode, out errorMessage))
            return false;

        string authUserNameTrimmed = "";
        string credentialSecretTrimmed = "";
        string? oauthClientIdTrimmed = null;
        string? oauthClientSecretTrimmed = null;
        string? oauthRefreshTrimmed = null;

        if (authMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (!TryValidateAuthUserName(authUserName, out string? trimmedAuthUserName, out errorMessage))
                return false;

            if (!TryValidateCredentialKeyVaultSecretName(credentialKeyVaultSecretName, out string? trimmedCredential, out errorMessage))
                return false;

            authUserNameTrimmed = trimmedAuthUserName!;
            credentialSecretTrimmed = trimmedCredential!;
        }
        else
        {
            if (!TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthClientIdKeyVaultSecretName,
                    OAuthClientIdKeyVaultSecretNameRequiredMessage,
                    out oauthClientIdTrimmed,
                    out errorMessage))
            {
                return false;
            }

            if (!TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthClientSecretKeyVaultSecretName,
                    OAuthClientSecretKeyVaultSecretNameRequiredMessage,
                    out oauthClientSecretTrimmed,
                    out errorMessage))
            {
                return false;
            }

            if (authMode is ItsmConnectorAuthMode.OAuth2RefreshToken
                && !TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthRefreshTokenKeyVaultSecretName,
                    OAuthRefreshTokenKeyVaultSecretNameRequiredMessage,
                    out oauthRefreshTrimmed,
                    out errorMessage))
            {
                return false;
            }
        }

        if (!TryValidateInboundWebhookKeyVaultSecretName(
                inboundWebhookKeyVaultSecretName,
                out string? inboundSecretName,
                out errorMessage))
        {
            return false;
        }

        command = new TenantItsmConnectorConnectionUpsertCommand
        {
            InstanceBaseUrl = trimmedInstanceBaseUrl!,
            AuthMode = authMode,
            AuthUserName = authUserNameTrimmed,
            CredentialKeyVaultSecretName = credentialSecretTrimmed,
            OAuthClientIdKeyVaultSecretName = oauthClientIdTrimmed,
            OAuthClientSecretKeyVaultSecretName = oauthClientSecretTrimmed,
            OAuthRefreshTokenKeyVaultSecretName = oauthRefreshTrimmed,
            InboundWebhookKeyVaultSecretName = inboundSecretName,
            IsEnabled = isEnabled,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim()
        };

        return true;
    }

    private static bool TryBuildAzureBoardsUpsertCommand(
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        command = null;
        errorMessage = null;

        if (!TryValidateInstanceBaseUrl(instanceBaseUrl, out string? trimmedInstanceBaseUrl, out errorMessage))
            return false;

        if (!TryParseAuthMode(authModeRaw, out ItsmConnectorAuthMode authMode, out errorMessage))
            return false;

        if (authMode is not ItsmConnectorAuthMode.BasicApiToken)
        {
            errorMessage = "Azure Boards connector supports BasicApiToken (PAT) auth mode only.";

            return false;
        }

        if (!TryValidateCredentialKeyVaultSecretName(credentialKeyVaultSecretName, out string? trimmedCredential, out errorMessage))
            return false;

        if (!TryValidateInboundWebhookKeyVaultSecretName(
                inboundWebhookKeyVaultSecretName,
                out string? inboundSecretName,
                out errorMessage))
        {
            return false;
        }

        string authUserNameTrimmed = string.IsNullOrWhiteSpace(authUserName) ? "" : authUserName.Trim();

        command = new TenantItsmConnectorConnectionUpsertCommand
        {
            InstanceBaseUrl = trimmedInstanceBaseUrl!,
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            AuthUserName = authUserNameTrimmed,
            CredentialKeyVaultSecretName = trimmedCredential!,
            OAuthClientIdKeyVaultSecretName = null,
            OAuthClientSecretKeyVaultSecretName = null,
            OAuthRefreshTokenKeyVaultSecretName = null,
            InboundWebhookKeyVaultSecretName = inboundSecretName,
            IsEnabled = isEnabled,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim()
        };

        return true;
    }
}
