using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

/// <summary>Durable row for <c>dbo.TenantItsmConnectorConnections</c>.</summary>
public sealed class TenantItsmConnectorConnectionRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public TenantItsmConnectorProvider Provider
    {
        get;
        init;
    }

    public string InstanceBaseUrl
    {
        get;
        init;
    } = "";

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

    public string? InboundWebhookKeyVaultSecretName
    {
        get;
        init;
    }

    public bool IsEnabled
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }
}
