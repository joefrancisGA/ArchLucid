using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsConnectors(IServiceCollection services, IConfiguration configuration)
    {
        RegisterIntegrationsConnectorsTenantDeletion(services);
        RegisterIntegrationsConnectorsItsmInbound(services);
        RegisterIntegrationsConnectorsCloudConnections(services);
        RegisterIntegrationsConnectorsOutboxMetrics(services, configuration);
    }
}
