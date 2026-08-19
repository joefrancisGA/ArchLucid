using ArchLucid.Application.CloudInventoryExtractor;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>AWS/GCP customer-controlled inventory ZIP ingest services.</summary>
    public static IServiceCollection AddCloudInventoryExtractorIngestServices(this IServiceCollection services)
    {
        services.AddScoped<ICloudInventoryExtractorIngestService, CloudInventoryExtractorIngestService>();
        services.AddScoped<CloudInventoryExtractorChunkedUploadService>();
        return services;
    }
}
