namespace ArchLucid.Contracts.Integrations;

/// <summary>ITSM provider integration page: stored health, tenant settings, and connector row.</summary>
public sealed class ItsmProviderIntegrationPageBundleResponse
{
    public required ItsmIntegrationHealthStatusResponse Health
    {
        get;
        init;
    }

    public required TenantItsmOutboundSettingsResponse Settings
    {
        get;
        init;
    }

    public required TenantItsmConnectorConnectionResponse Connection
    {
        get;
        init;
    }
}
