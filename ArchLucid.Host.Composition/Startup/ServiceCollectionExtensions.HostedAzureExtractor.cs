using ArchLucid.Host.Composition.Startup.Modules;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Hosted Azure Extractor HTTP clients and ingest services (TB-028: registered from composition root, not Api).
    /// </summary>
    public static IServiceCollection AddHostedAzureExtractorIntegrationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        HostedCloudExtractorCompositionModule.RegisterAzure(services, configuration);
        return services;
    }
}
