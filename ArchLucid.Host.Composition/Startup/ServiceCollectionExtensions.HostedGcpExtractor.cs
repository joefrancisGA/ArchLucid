using ArchLucid.Host.Composition.Startup.Modules;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Hosted GCP Extractor clients and ingest orchestration (TB-403).
    /// </summary>
    public static IServiceCollection AddHostedGcpExtractorIntegrationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        HostedCloudExtractorCompositionModule.RegisterGcp(services, configuration);
        return services;
    }
}
