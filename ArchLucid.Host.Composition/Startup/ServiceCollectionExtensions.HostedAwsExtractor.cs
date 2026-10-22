using ArchLucid.Host.Composition.Startup.Modules;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Hosted AWS Extractor clients and ingest orchestration (TB-402).
    /// </summary>
    public static IServiceCollection AddHostedAwsExtractorIntegrationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        HostedCloudExtractorCompositionModule.RegisterAws(services, configuration);
        return services;
    }
}
