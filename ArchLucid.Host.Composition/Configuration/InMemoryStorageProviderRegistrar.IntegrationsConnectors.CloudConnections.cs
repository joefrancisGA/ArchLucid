using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.Search;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.SecureNow;

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
        services.AddSingleton<ICollectionRunRepository, InMemoryCollectionRunRepository>();
        services.AddSingleton<ICollectionTriggerClaimRepository, InMemoryCollectionTriggerClaimRepository>();
        services.AddSingleton<ICollectionRunArtifactReader, EmptyCollectionRunArtifactReader>();
        services.AddSingleton<ITenantFirstValueReportBrandingRepository, InMemoryTenantFirstValueReportBrandingRepository>();
    }
}
