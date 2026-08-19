using ArchLucid.Core.Scoping;

using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ArchLucid.Persistence.BlobStore;

/// <summary>Azure Blob Storage using regional <see cref="BlobServiceClient" /> bindings + tenant-scoped path prefixes.</summary>
public sealed class AzureBlobArtifactBlobStore(
    ITenantRegionalArtifactBlobClients regionalClients,
    TokenCredential credential,
    IScopeContextProvider scopeProvider) : IArtifactBlobStore
{
    private readonly TokenCredential _credential = credential ?? throw new ArgumentNullException(nameof(credential));

    private readonly ITenantRegionalArtifactBlobClients _regionalClients =
        regionalClients ?? throw new ArgumentNullException(nameof(regionalClients));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    public async Task<string> WriteAsync(string containerName, string blobName, string content, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(containerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(blobName);

        BlobServiceClient serviceClient = await ScopedClientAsync(ct).ConfigureAwait(false);

        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, blobName);

        BlobContainerClient container = serviceClient.GetBlobContainerClient(containerName.ToLowerInvariant());
        await container.CreateIfNotExistsAsync(cancellationToken: ct).ConfigureAwait(false);

        BlobClient blob = container.GetBlobClient(scopedBlobName);

        await blob.UploadAsync(
                new BinaryData(content),
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = "application/json; charset=utf-8" }
                },
                ct)

            .ConfigureAwait(false);

        return blob.Uri.ToString();
    }

    public async Task<string?> TryGetExistingUriAsync(string containerName, string logicalBlobName, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(containerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(logicalBlobName);

        BlobServiceClient serviceClient = await ScopedClientAsync(ct).ConfigureAwait(false);

        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalBlobName);

        BlobContainerClient container = serviceClient.GetBlobContainerClient(containerName.ToLowerInvariant());
        BlobClient blob = container.GetBlobClient(scopedBlobName);

        if (!await blob.ExistsAsync(ct).ConfigureAwait(false))
            return null;

        return blob.Uri.ToString();
    }

    public async Task<string?> ReadAsync(string blobUri, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(blobUri))
            return null;

        BlobClient blob = new(new Uri(blobUri, UriKind.Absolute), _credential);

        ArtifactBlobTenantPaths.EnsureReadBlobNameMatchesTenant(_scopeProvider, blob.Name);

        Response<BlobDownloadResult> response = await blob.DownloadContentAsync(ct).ConfigureAwait(false);
        return response.Value.Content.ToString();
    }

    private Task<BlobServiceClient> ScopedClientAsync(CancellationToken ct)

        => _regionalClients.GetArtifactsBlobServiceClientAsync(_scopeProvider.GetCurrentScope().TenantId, ct);
}
