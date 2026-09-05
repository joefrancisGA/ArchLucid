using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Search;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsConnectorsCloudConnections(IServiceCollection services)
    {
        services.AddSingleton<ITenantHostedExtractorConfigurationRepository, InMemoryTenantHostedExtractorConfigurationRepository>();
        services.AddSingleton<ITenantAwsConnectionRepository, InMemoryTenantAwsConnectionRepository>();
        services.AddSingleton<ITenantGcpConnectionRepository, InMemoryTenantGcpConnectionRepository>();
        services.AddSingleton<IGlobalSearchRepository, InMemoryGlobalSearchRepository>();
        services.AddSingleton<ITenantFirstValueReportBrandingRepository, InMemoryTenantFirstValueReportBrandingRepository>();
    }
}
