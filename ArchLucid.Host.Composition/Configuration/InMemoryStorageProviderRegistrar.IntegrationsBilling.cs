using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsBilling(IServiceCollection services, IConfiguration configuration)
    {
        RegisterBilling(services, configuration);
        RegisterIntegrationsConnectors(services, configuration);
        RegisterUsageEvents(services);
    }
}
