using ArchLucid.Application.AwsExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.AwsExtractor;

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
        services.AddScoped<IHostedAwsExtractorRunService, HostedAwsExtractorRunService>();
        services.AddScoped<IAwsExtractorAutoPullOrchestrator, AwsExtractorAutoPullOrchestrator>();
        services.Configure<HostedAwsExtractorOptions>(configuration.GetSection(HostedAwsExtractorOptions.SectionName));
        services.Configure<AwsExtractorAutoPullOptions>(configuration.GetSection(AwsExtractorAutoPullOptions.SectionName));
        services.AddSingleton<IAwsOidcWebIdentityTokenProvider, AzureManagedIdentityAwsWebIdentityTokenProvider>();
        services.AddScoped<IHostedAwsExtractorClient, HostedAwsExtractorClient>();

        return services;
    }
}
