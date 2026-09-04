// Hosted multi-cloud extractor integration composition registrations.

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.AzureExtractor.Stages;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;
using ArchLucid.Integrations.AzureExtractor;
using ArchLucid.Integrations.AwsExtractor;
using ArchLucid.Integrations.GcpExtractor;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Hosted Azure, AWS, and GCP extractor HTTP clients and ingest orchestration DI registrations.
/// </summary>
public static class HostedCloudExtractorCompositionModule
{
    /// <summary>
    ///     Registers hosted Azure, AWS, and GCP extractor integration services.
    /// </summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterAzure(services, configuration);
        RegisterAws(services, configuration);
        RegisterGcp(services, configuration);
    }

    /// <summary>Registers hosted Azure extractor integration services.</summary>
    public static void RegisterAzure(IServiceCollection services, IConfiguration configuration) =>
        RegisterAzureExtractor(services, configuration);

    /// <summary>Registers hosted AWS extractor integration services.</summary>
    public static void RegisterAws(IServiceCollection services, IConfiguration configuration) =>
        RegisterAwsExtractor(services, configuration);

    /// <summary>Registers hosted GCP extractor integration services.</summary>
    public static void RegisterGcp(IServiceCollection services, IConfiguration configuration) =>
        RegisterGcpExtractor(services, configuration);

    private static void RegisterAzureExtractor(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IHostedAzureExtractorConfigurationService, HostedAzureExtractorConfigurationService>();
        services.AddScoped<IHostedAzureExtractorRunService, HostedAzureExtractorRunService>();
        services.AddScoped<IAzureExtractorAutoPullOrchestrator, AzureExtractorAutoPullOrchestrator>();
        services.Configure<HostedAzureExtractorOptions>(configuration.GetSection(HostedAzureExtractorOptions.SectionName));
        services.AddSingleton<IHostedAzureExtractorCredentialFactory, WorkloadIdentityHostedAzureExtractorCredentialFactory>();
        services
            .AddHttpClient<IHostedAzureArmReadClient, GetOnlyHostedAzureArmReadClient>(static client =>
            {
                client.Timeout = TimeSpan.FromMinutes(5);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(static serviceProvider =>
                ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy.Create(
                    serviceProvider
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("HostedAzureArmReadClient.Policies")));
        services.AddScoped<IHostedAzureExtractorClient, HostedAzureExtractorClient>();
        services.AddScoped<IAzureExtractorPreparedZipValidateStage, AzureExtractorPreparedZipValidateStage>();
        services.AddScoped<IAzureExtractorPreparedZipPersistStage, AzureExtractorPreparedZipPersistStage>();
        services.AddScoped<IAzureExtractorIngestService, AzureExtractorIngestService>();
        services.AddScoped<IAzureExtractorResultEnricher, AzureExtractorResultEnricher>();
        InfraEvidenceCompositionModule.Register(services);
        services.Configure<AzureExtractorEnrichmentOptions>(
            configuration.GetSection(AzureExtractorEnrichmentOptions.SectionPath));
        services.AddScoped<AzureExtractorChunkedUploadService>();
    }

    private static void RegisterAwsExtractor(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IHostedAwsExtractorRunService, HostedAwsExtractorRunService>();
        services.AddScoped<IAwsExtractorAutoPullOrchestrator, AwsExtractorAutoPullOrchestrator>();
        services.Configure<HostedAwsExtractorOptions>(configuration.GetSection(HostedAwsExtractorOptions.SectionName));
        services.Configure<AwsExtractorAutoPullOptions>(configuration.GetSection(AwsExtractorAutoPullOptions.SectionName));
        services.AddSingleton<IAwsOidcWebIdentityTokenProvider, AzureManagedIdentityAwsWebIdentityTokenProvider>();
        services.AddScoped<IHostedAwsExtractorClient, HostedAwsExtractorClient>();
    }

    private static void RegisterGcpExtractor(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IHostedGcpExtractorRunService, HostedGcpExtractorRunService>();
        services.AddScoped<IGcpExtractorAutoPullOrchestrator, GcpExtractorAutoPullOrchestrator>();
        services.Configure<HostedGcpExtractorOptions>(configuration.GetSection(HostedGcpExtractorOptions.SectionName));
        services.Configure<GcpExtractorAutoPullOptions>(configuration.GetSection(GcpExtractorAutoPullOptions.SectionName));
        services.AddSingleton<IGcpSubjectTokenProvider, AzureManagedIdentityGcpSubjectTokenProvider>();
        services.AddSingleton<GcpWorkloadIdentityCredentialFactory>();
        services.AddScoped<IHostedGcpExtractorClient, HostedGcpExtractorClient>();
    }
}
