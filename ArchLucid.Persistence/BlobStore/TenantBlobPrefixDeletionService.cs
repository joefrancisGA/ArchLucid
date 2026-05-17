using ArchLucid.Core.Tenancy;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.BlobStore;

/// <summary>
///     Deletes virtual-directory prefixes matching <see cref="ArtifactBlobTenantPaths.TenantPrefixDirectorySegment" /> in
///     artifact/agent containers. Skips content-addressed <c>artifact-contents</c> dedup container (shared across tenants).
/// </summary>
public sealed class TenantBlobPrefixDeletionService(
    IOptionsMonitor<ArtifactLargePayloadOptions> payloadOptions,
    BlobServiceClient? blobServiceClient = null) : ITenantBlobPrefixDeletionService
{
    private readonly IOptionsMonitor<ArtifactLargePayloadOptions> _payloadOptions =
        payloadOptions ?? throw new ArgumentNullException(nameof(payloadOptions));

    private readonly BlobServiceClient? _blobServiceClient = blobServiceClient;

    private static readonly string[] PrefixContainers =
    [
        "golden-manifests",
        "artifact-bundles",
        "agent-traces"
    ];

    public async Task<TenantBlobPrefixDeletionResult> DeleteAllTenantPrefixesAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        ArtifactLargePayloadOptions opts = _payloadOptions.CurrentValue;
        Dictionary<string, int> byContainer = new(StringComparer.OrdinalIgnoreCase);

        if (!string.Equals(opts.BlobProvider, "AzureBlob", StringComparison.OrdinalIgnoreCase) ||
            _blobServiceClient is null)
        {
            string root = string.IsNullOrWhiteSpace(opts.LocalRootPath)
                ? Path.Combine(AppContext.BaseDirectory, "blob-store")
                : opts.LocalRootPath;

            root = Path.GetFullPath(root);

            if (string.Equals(opts.BlobProvider, "Local", StringComparison.OrdinalIgnoreCase))
            {
                string segment = ArtifactBlobTenantPaths.TenantPrefixDirectorySegment(tenantId).TrimEnd('/');
                string safeSegment = SanitizeFileToken(segment);

                foreach (string container in PrefixContainers)
                {
                    string cdir = Path.Combine(root, SanitizeFileToken(container), safeSegment);

                    if (!Directory.Exists(cdir))
                    {
                        byContainer[container] = 0;

                        continue;
                    }

                    int files = Directory.GetFiles(cdir, "*", SearchOption.AllDirectories).Length;
                    Directory.Delete(cdir, recursive: true);
                    byContainer[container] = files;
                }
            }

            return new TenantBlobPrefixDeletionResult { BlobsDeletedByContainer = byContainer };
        }

        string prefix = ArtifactBlobTenantPaths.TenantPrefixDirectorySegment(tenantId);

        foreach (string containerName in PrefixContainers)
        {
            BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName.ToLowerInvariant());
            int deleted = 0;

            await foreach (BlobItem item in container.GetBlobsAsync(
                               BlobTraits.None,
                               BlobStates.All,
                               prefix: prefix,
                               cancellationToken: cancellationToken)
                           .ConfigureAwait(false))
            {
                await container.DeleteBlobIfExistsAsync(
                        item.Name,
                        DeleteSnapshotsOption.IncludeSnapshots,
                        cancellationToken: cancellationToken)
                    .ConfigureAwait(false);

                deleted++;
            }

            byContainer[containerName] = deleted;
        }

        return new TenantBlobPrefixDeletionResult { BlobsDeletedByContainer = byContainer };
    }

    private static string SanitizeFileToken(string segment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(segment);

        return Path.GetInvalidFileNameChars().Aggregate(segment, (current, c) => current.Replace(c, '_')).Trim();
    }
}
