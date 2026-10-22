using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

/// <summary>Validated upsert payload for <c>dbo.TenantItsmConnectorConnections</c> (TB-392 / TB-600).</summary>
public sealed class TenantItsmConnectorConnectionUpsertCommand
{
    public required string InstanceBaseUrl
    {
        get;
        init;
    }

    public ItsmConnectorAuthMode AuthMode
    {
        get;
        init;
    } = ItsmConnectorAuthMode.BasicApiToken;

    public string AuthUserName
    {
        get;
        init;
    } = "";

    public string CredentialKeyVaultSecretName
    {
        get;
        init;
    } = "";

    public string? OAuthClientIdKeyVaultSecretName
    {
        get;
        init;
    }

    public string? OAuthClientSecretKeyVaultSecretName
    {
        get;
        init;
    }

    public string? OAuthRefreshTokenKeyVaultSecretName
    {
        get;
        init;
    }

    public string? InboundWebhookKeyVaultSecretName
    {
        get;
        init;
    }

    public bool IsEnabled
    {
        get;
        init;
    } = true;

    public string? Label
    {
        get;
        init;
    }
}
