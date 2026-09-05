using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;

using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandAssetBlobStore : ITenantBrandAssetBlobStore
{
    private const string ContainerName = "tenant-branding";

    private readonly IScopeContextProvider _scopeProvider;
    private readonly ITenantRegionalArtifactBlobClients? _regionalClients;
    private readonly TokenCredential? _credential;
    private readonly string? _localRootPath;

    public TenantBrandAssetBlobStore(
        IScopeContextProvider scopeProvider,
        ITenantRegionalArtifactBlobClients regionalClients,
        TokenCredential credential)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
        _regionalClients = regionalClients ?? throw new ArgumentNullException(nameof(regionalClients));
        _credential = credential ?? throw new ArgumentNullException(nameof(credential));
    }

    public TenantBrandAssetBlobStore(IScopeContextProvider scopeProvider, string localBlobRootPath)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

        if (string.IsNullOrWhiteSpace(localBlobRootPath))
            throw new ArgumentException("Local blob root is required.", nameof(localBlobRootPath));

        _localRootPath = Path.GetFullPath(localBlobRootPath);
    }

    public async Task<string> WriteAsync(
        Guid assetId,
        string fileExtension,
        string mimeType,
        byte[] assetBytes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assetBytes);

        string logicalPath = $"assets/{assetId:N}{fileExtension}";

        if (_regionalClients is not null && _credential is not null)
        {
            await UploadAzureAsync(logicalPath, mimeType, assetBytes, cancellationToken);
            return logicalPath;
        }

        if (_localRootPath is not null)
        {
            await UploadLocalAsync(logicalPath, assetBytes, cancellationToken);
            return logicalPath;
        }

        throw new InvalidOperationException("Tenant brand asset blob storage is not configured.");
    }

    public async Task<byte[]?> TryReadAsync(string storageReference, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storageReference))
            return null;

        if (_regionalClients is not null && _credential is not null)
            return await TryReadAzureAsync(storageReference, cancellationToken);

        if (_localRootPath is null)
            return null;

        string fullPath = ResolveLocalFullPath(storageReference);

        if (!File.Exists(fullPath))
            return null;

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }

    private async Task UploadAzureAsync(string logicalPath, string mimeType, byte[] assetBytes, CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;
        BlobServiceClient serviceClient =
            await _regionalClients!.GetArtifactsBlobServiceClientAsync(tenantId, cancellationToken);
        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        BlobContainerClient container = serviceClient.GetBlobContainerClient(ContainerName.ToLowerInvariant());
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
        BlobClient blob = container.GetBlobClient(scopedBlobName);

        await blob.UploadAsync(
            new BinaryData(assetBytes),
            new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = mimeType } },
            cancellationToken);
    }

    private async Task UploadLocalAsync(string logicalPath, byte[] assetBytes, CancellationToken cancellationToken)
    {
        string fullPath = ResolveLocalFullPath(logicalPath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, assetBytes, cancellationToken);
    }

    private async Task<byte[]?> TryReadAzureAsync(string logicalPath, CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;
        BlobServiceClient serviceClient =
            await _regionalClients!.GetArtifactsBlobServiceClientAsync(tenantId, cancellationToken);
        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        BlobContainerClient container = serviceClient.GetBlobContainerClient(ContainerName.ToLowerInvariant());
        BlobClient blob = container.GetBlobClient(scopedBlobName);

        if (!await blob.ExistsAsync(cancellationToken))
            return null;

        Response<BlobDownloadResult> response = await blob.DownloadContentAsync(cancellationToken);
        return response.Value.Content.ToArray();
    }

    private string ResolveLocalFullPath(string logicalPath)
    {
        string safeContainer = SanitizeSegment(ContainerName);
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

        return parts.Count > 0 ? Path.Combine(parts.ToArray()) : "asset.bin";
    }
}
