using ArchLucid.Core.Scoping;

using ArchLucid.Persistence.AzureExtractorChunkUpload;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Greenfield SQL host plus deterministic Local chunk staging DI override (Advanced defaults leave BlobProvider None).
/// </summary>
public sealed class GreenfieldSqlApiFactoryWithLocalArtifactBlob : GreenfieldSqlApiFactory
{
    private readonly string _blobRoot =
        Path.Combine(Path.GetTempPath(), "ArchLucidBlob_" + Guid.NewGuid().ToString("N"));

    public GreenfieldSqlApiFactoryWithLocalArtifactBlob()
    {
        Directory.CreateDirectory(_blobRoot);
    }

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        string stagingRoot =
            Path.Combine(Path.GetFullPath(_blobRoot), AzureExtractorChunkUploadOptions.DefaultLocalStagingRelativeDirectory);

        Directory.CreateDirectory(stagingRoot);

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IAzureExtractorChunkSessionStore>();

            services.AddScoped<IAzureExtractorChunkSessionStore>(sp =>
                new LocalAzureExtractorChunkSessionStore(
                    stagingRoot,
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<IOptions<AzureExtractorChunkUploadOptions>>()));
        });
    }

    /// <inheritdoc />
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            try
            {
                if (Directory.Exists(_blobRoot))
                    Directory.Delete(_blobRoot, recursive: true);
            }
            catch
            {
                // Best-effort cleanup for ephemeral integration staging paths.
            }
        }

        base.Dispose(disposing);
    }
}
