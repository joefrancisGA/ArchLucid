using ArchLucid.Application.GcpExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.GcpExtractor;

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
        services.AddScoped<IHostedGcpExtractorRunService, HostedGcpExtractorRunService>();
        services.AddScoped<IGcpExtractorAutoPullOrchestrator, GcpExtractorAutoPullOrchestrator>();
        services.Configure<HostedGcpExtractorOptions>(configuration.GetSection(HostedGcpExtractorOptions.SectionName));
        services.Configure<GcpExtractorAutoPullOptions>(configuration.GetSection(GcpExtractorAutoPullOptions.SectionName));
        services.AddSingleton<IGcpSubjectTokenProvider, AzureManagedIdentityGcpSubjectTokenProvider>();
        services.AddSingleton<GcpWorkloadIdentityCredentialFactory>();
        services.AddScoped<IHostedGcpExtractorClient, HostedGcpExtractorClient>();

        return services;
    }
}
