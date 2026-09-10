using ArchLucid.Application.Evidence;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>Infrastructure-evidence capability composition facade.</summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>Registers infrastructure-evidence capability services.</summary>
    public static IServiceCollection AddInfraEvidenceCapability(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<AzureExtractorAutoPullOptions>(
            configuration.GetSection(AzureExtractorAutoPullOptions.SectionName));
        InfraEvidenceCompositionModule.Register(services);
        RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
        RegisterAwsExtractorAutoPullHostedService(services, hostingRole);
        RegisterGcpExtractorAutoPullHostedService(services, hostingRole);
        services.Configure<EvidenceBulkUploadOptions>(
            configuration.GetSection(EvidenceBulkUploadOptions.SectionName));
        services.Configure<ZipEvidenceExpanderOptions>(
            configuration.GetSection(ZipEvidenceExpanderOptions.SectionName));
        services.AddSingleton<IZipEvidenceExpanderService, ZipEvidenceExpanderService>();
        services.AddScoped<IBulkEvidenceUploadService, BulkEvidenceUploadService>();
        services.AddScoped<IRunStoredEvidenceFileCatalogService, RunStoredEvidenceFileCatalogService>();
        services.AddScoped<IRunStoredEvidenceFileContentService, RunStoredEvidenceFileContentService>();

        return services;
    }
}
