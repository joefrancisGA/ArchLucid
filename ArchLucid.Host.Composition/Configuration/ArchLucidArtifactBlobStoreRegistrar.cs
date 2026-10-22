using ArchLucid.Application.Exports;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Support;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;
using ArchLucid.Persistence.AzureExtractorChunkUpload;
using ArchLucid.Persistence.BlobStore;

using Azure.Core;
using Azure.Identity;
using Azure.Storage.Blobs;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Artifact large-payload blob store and related chunk-upload / export bundle registrations.
/// </summary>
internal static class ArchLucidArtifactBlobStoreRegistrar
{
    public static void RegisterArtifactLargePayloadBlobStore(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ArtifactLargePayloadOptions>(
            configuration.GetSection(ArtifactLargePayloadOptions.SectionName));
        services.Configure<AzureExtractorChunkUploadOptions>(
            configuration.GetSection(AzureExtractorChunkUploadOptions.SectionName));

        ArtifactLargePayloadOptions snapshot = configuration
                                                   .GetSection(ArtifactLargePayloadOptions.SectionName)
                                                   .Get<ArtifactLargePayloadOptions>()
                                               ?? new ArtifactLargePayloadOptions();

        AzureExtractorChunkUploadOptions chunkSnapshot =
            configuration.GetSection(AzureExtractorChunkUploadOptions.SectionName).Get<AzureExtractorChunkUploadOptions>()
            ?? new AzureExtractorChunkUploadOptions();

        string provider = snapshot.BlobProvider;

        if (string.Equals(provider, "AzureBlob", StringComparison.OrdinalIgnoreCase))
        {
            string uriText = snapshot.AzureBlobServiceUri;

            if (string.IsNullOrWhiteSpace(uriText))

                throw new InvalidOperationException(
                    "ArtifactLargePayload:AzureBlobServiceUri is required when BlobProvider is AzureBlob.");


            Uri serviceUri = new(uriText, UriKind.Absolute);
            services.AddSingleton<TokenCredential>(_ => new DefaultAzureCredential());
            services.AddSingleton<RegionalArtifactBlobClientFactory>();

            services.AddSingleton(sp =>
                new BlobServiceClient(serviceUri, sp.GetRequiredService<TokenCredential>()));
            services.AddScoped<ITenantRegionalArtifactBlobClients, TenantRegionalArtifactBlobClients>();
            services.AddScoped<IArtifactBlobStore>(sp =>
                new AzureBlobArtifactBlobStore(
                    sp.GetRequiredService<ITenantRegionalArtifactBlobClients>(),
                    sp.GetRequiredService<TokenCredential>(),
                    sp.GetRequiredService<IScopeContextProvider>()));
            services.AddScoped<IAzureExtractorChunkSessionStore, AzureBlobAzureExtractorChunkSessionStore>();
            services.AddScoped<ITenantReviewBoardCoverLogoStore>(sp =>
                new Application.Exports.TenantReviewBoardCoverLogoStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<ITenantRegionalArtifactBlobClients>(),
                    sp.GetRequiredService<TokenCredential>()));
            services.AddScoped<ITenantBrandAssetBlobStore>(sp =>
                new TenantBrandAssetBlobStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<ITenantRegionalArtifactBlobClients>(),
                    sp.GetRequiredService<TokenCredential>()));
            services.AddScoped<ISupportProblemReportBundleStore>(sp =>
                new SupportProblemReportBundleStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<ITenantRegionalArtifactBlobClients>(),
                    sp.GetRequiredService<TokenCredential>()));
        }
        else if (string.Equals(provider, "Local", StringComparison.OrdinalIgnoreCase))
        {
            string resolvedRoot = Path.GetFullPath(
                string.IsNullOrWhiteSpace(snapshot.LocalRootPath)
                    ? Path.Combine(AppContext.BaseDirectory, "blob-store")
                    : snapshot.LocalRootPath);

            string stagingRelative = string.IsNullOrWhiteSpace(chunkSnapshot.LocalStagingRelativeDirectory)
                ? "azure-extractor-chunk-upload"
                : chunkSnapshot.LocalStagingRelativeDirectory.Trim();

            string stagingRoot = Path.Combine(resolvedRoot, stagingRelative);

            services.AddSingleton<IArtifactBlobStore>(sp =>
                new LocalFileArtifactBlobStore(resolvedRoot, sp.GetRequiredService<IScopeContextProvider>()));

            services.AddScoped<IAzureExtractorChunkSessionStore>(sp =>
                new LocalAzureExtractorChunkSessionStore(
                    stagingRoot,
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<IOptions<AzureExtractorChunkUploadOptions>>()));
            services.AddScoped<ITenantReviewBoardCoverLogoStore>(sp =>
                new Application.Exports.TenantReviewBoardCoverLogoStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    resolvedRoot));
            services.AddScoped<ITenantBrandAssetBlobStore>(sp =>
                new TenantBrandAssetBlobStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    resolvedRoot));
            services.AddScoped<ISupportProblemReportBundleStore>(sp =>
                new SupportProblemReportBundleStore(
                    sp.GetRequiredService<IScopeContextProvider>(),
                    resolvedRoot));
        }
        else

        {
            services.AddSingleton<IArtifactBlobStore, NullArtifactBlobStore>();

            services.AddSingleton<IAzureExtractorChunkSessionStore, NullAzureExtractorChunkSessionStore>();

            services.AddSingleton<ITenantReviewBoardCoverLogoStore, NullTenantReviewBoardCoverLogoStore>();
            services.AddSingleton<ITenantBrandAssetBlobStore, NullTenantBrandAssetBlobStore>();
            services.AddSingleton<ISupportProblemReportBundleStore, NullSupportProblemReportBundleStore>();
        }

    }
}
