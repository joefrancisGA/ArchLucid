using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.AzureExtractor;

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
        services.AddScoped<IHostedAzureExtractorConfigurationService, HostedAzureExtractorConfigurationService>();
        services.AddScoped<IHostedAzureExtractorRunService, HostedAzureExtractorRunService>();
        services.AddScoped<IAzureExtractorAutoPullOrchestrator, AzureExtractorAutoPullOrchestrator>();
        services.Configure<HostedAzureExtractorOptions>(configuration.GetSection(HostedAzureExtractorOptions.SectionName));
        services.AddSingleton<IHostedAzureExtractorCredentialFactory, WorkloadIdentityHostedAzureExtractorCredentialFactory>();
        services.AddHttpClient<IHostedAzureArmReadClient, GetOnlyHostedAzureArmReadClient>(static client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        });
        services.AddScoped<IHostedAzureExtractorClient, HostedAzureExtractorClient>();
        services.AddScoped<IAzureExtractorIngestService, AzureExtractorIngestService>();
        services.AddScoped<IAzureExtractorResultEnricher, AzureExtractorResultEnricher>();
        services.Configure<AzureExtractorEnrichmentOptions>(
            configuration.GetSection(AzureExtractorEnrichmentOptions.SectionPath));
        services.AddScoped<AzureExtractorChunkedUploadService>();

        return services;
    }
}
