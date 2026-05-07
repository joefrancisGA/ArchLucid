namespace ArchLucid.Api.Models.Tenancy;

public sealed class TenantIntegrationsOperationsResponse
{
    public IReadOnlyList<ConnectorSurfaceStatusResponse> Connectors
    {
        get;
        set;
    } = [];

    public IntegrationEventBusStatusResponse IntegrationEventBus
    {
        get;
        set;
    } = new();
}
