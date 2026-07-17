using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;
using ArchLucid.Persistence.BlobStore;

using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ArchLucid.Application.Support;

/// <summary>
///     Tenant-scoped blob storage for optional support bundles attached to problem reports (TB-787).
/// </summary>
public sealed class SupportProblemReportBundleStore : ISupportProblemReportBundleStore
{
    private readonly IScopeContextProvider _scopeProvider;
    private readonly ITenantRegionalArtifactBlobClients? _regionalClients;
    private readonly TokenCredential? _credential;
    private readonly string? _localRootPath;

    public SupportProblemReportBundleStore(
        IScopeContextProvider scopeProvider,
        ITenantRegionalArtifactBlobClients regionalClients,
        TokenCredential credential)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
        _regionalClients = regionalClients ?? throw new ArgumentNullException(nameof(regionalClients));
        _credential = credential ?? throw new ArgumentNullException(nameof(credential));
    }

    public SupportProblemReportBundleStore(IScopeContextProvider scopeProvider, string localBlobRootPath)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

        if (string.IsNullOrWhiteSpace(localBlobRootPath))
        {
            throw new ArgumentException("Local blob root is required.", nameof(localBlobRootPath));
        }

        _localRootPath = Path.GetFullPath(localBlobRootPath);
    }

    public async Task<string?> TryStoreAsync(
        Guid reportId,
        byte[] zipBytes,
        string fileName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(zipBytes);
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        if (zipBytes.Length == 0)
        {
            return null;
        }

        string logicalPath = SupportProblemReportBundleBlobPaths.RelativePath(reportId, fileName);

        if (_regionalClients is not null && _credential is not null)
        {
            return await TryStoreAzureAsync(logicalPath, zipBytes, cancellationToken).ConfigureAwait(false);
        }

        if (_localRootPath is not null)
        {
            return await TryStoreLocalAsync(logicalPath, zipBytes, cancellationToken).ConfigureAwait(false);
        }

        return null;
    }

    private async Task<string?> TryStoreAzureAsync(string logicalPath, byte[] zipBytes, CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;
        BlobServiceClient serviceClient =
            await _regionalClients!.GetArtifactsBlobServiceClientAsync(tenantId, cancellationToken).ConfigureAwait(false);
        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        BlobContainerClient container =
            serviceClient.GetBlobContainerClient(SupportProblemReportBundleBlobPaths.ContainerName.ToLowerInvariant());
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
        BlobClient blob = container.GetBlobClient(scopedBlobName);

        await blob.UploadAsync(
                new BinaryData(zipBytes),
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = "application/zip" } },
                cancellationToken)
            .ConfigureAwait(false);

        return blob.Uri.ToString();
    }

    private async Task<string?> TryStoreLocalAsync(string logicalPath, byte[] zipBytes, CancellationToken cancellationToken)
    {
        string fullPath = ResolveLocalFullPath(logicalPath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, zipBytes, cancellationToken).ConfigureAwait(false);

        return new Uri(fullPath).AbsoluteUri;
    }

    private string ResolveLocalFullPath(string logicalPath)
    {
        string safeContainer = SanitizeSegment(SupportProblemReportBundleBlobPaths.ContainerName);
        string scopedLogical = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        string safeName = SanitizeBlobName(scopedLogical);

        return Path.Combine(_localRootPath!, safeContainer, safeName);
    }

    private static string SanitizeSegment(string segment) =>
        Path.GetInvalidFileNameChars().Aggregate(segment, (current, c) => current.Replace(c, '_')).Trim();

    private static string SanitizeBlobName(string blobName)
    {
        blobName = blobName.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        List<string> parts = blobName.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)
            .Select(SanitizeSegment)
            .Where(static s => s.Length > 0)
            .ToList();

        return parts.Count > 0 ? Path.Combine(parts.ToArray()) : "support-bundle.zip";
    }
}
