using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;

using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Stores cover logos under <see cref="TenantReviewBoardCoverLogoBlobPaths.ContainerName" /> with tenant path prefixing.
/// </summary>
public sealed class TenantReviewBoardCoverLogoStore : ITenantReviewBoardCoverLogoStore
{
    private readonly IScopeContextProvider _scopeProvider;
    private readonly ITenantRegionalArtifactBlobClients? _regionalClients;
    private readonly TokenCredential? _credential;
    private readonly string? _localRootPath;

    public TenantReviewBoardCoverLogoStore(
        IScopeContextProvider scopeProvider,
        ITenantRegionalArtifactBlobClients regionalClients,
        TokenCredential credential)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
        _regionalClients = regionalClients ?? throw new ArgumentNullException(nameof(regionalClients));
        _credential = credential ?? throw new ArgumentNullException(nameof(credential));
    }

    public TenantReviewBoardCoverLogoStore(IScopeContextProvider scopeProvider, string localBlobRootPath)
    {
        _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

        if (string.IsNullOrWhiteSpace(localBlobRootPath))
            throw new ArgumentException("Local blob root is required.", nameof(localBlobRootPath));

        _localRootPath = Path.GetFullPath(localBlobRootPath);
    }

    /// <inheritdoc />
    public async Task UploadAsync(byte[] logoBytes, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(logoBytes);
        ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(logoBytes);

        string extension = IsPng(logoBytes) ? ".png" : ".jpg";
        string logicalPath = TenantReviewBoardCoverLogoBlobPaths.CoverLogoRelativePath + extension;

        if (_regionalClients is not null && _credential is not null)
        {
            await UploadAzureAsync(logicalPath, logoBytes, cancellationToken).ConfigureAwait(false);
            return;
        }

        if (_localRootPath is not null)
        {
            await UploadLocalAsync(logicalPath, logoBytes, cancellationToken).ConfigureAwait(false);
            return;
        }

        throw new InvalidOperationException("Tenant review-board cover logo storage is not configured.");
    }

    /// <inheritdoc />
    public async Task<byte[]?> TryGetBytesAsync(CancellationToken cancellationToken)
    {
        foreach (string suffix in new[] { ".png", ".jpg", ".jpeg" })
        {
            string logicalPath = TenantReviewBoardCoverLogoBlobPaths.CoverLogoRelativePath + suffix;
            byte[]? bytes = await TryReadLogicalPathAsync(logicalPath, cancellationToken).ConfigureAwait(false);

            if (bytes is { Length: > 0 })
                return bytes;
        }

        return null;
    }

    private async Task UploadAzureAsync(string logicalPath, byte[] logoBytes, CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;
        BlobServiceClient serviceClient =
            await _regionalClients!.GetArtifactsBlobServiceClientAsync(tenantId, cancellationToken).ConfigureAwait(false);
        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        BlobContainerClient container =
            serviceClient.GetBlobContainerClient(TenantReviewBoardCoverLogoBlobPaths.ContainerName.ToLowerInvariant());
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
        BlobClient blob = container.GetBlobClient(scopedBlobName);
        string contentType = IsPng(logoBytes) ? "image/png" : "image/jpeg";

        await blob.UploadAsync(
                new BinaryData(logoBytes),
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = contentType } },
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task UploadLocalAsync(string logicalPath, byte[] logoBytes, CancellationToken cancellationToken)
    {
        string fullPath = ResolveLocalFullPath(logicalPath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, logoBytes, cancellationToken).ConfigureAwait(false);
    }

    private async Task<byte[]?> TryReadLogicalPathAsync(string logicalPath, CancellationToken cancellationToken)
    {
        if (_regionalClients is not null && _credential is not null)
            return await TryReadAzureAsync(logicalPath, cancellationToken).ConfigureAwait(false);

        if (_localRootPath is null)
            return null;

        string fullPath = ResolveLocalFullPath(logicalPath);

        if (!File.Exists(fullPath))
            return null;

        return await File.ReadAllBytesAsync(fullPath, cancellationToken).ConfigureAwait(false);
    }

    private string ResolveLocalFullPath(string logicalPath)
    {
        string safeContainer = SanitizeSegment(TenantReviewBoardCoverLogoBlobPaths.ContainerName);
        string scopedLogical = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        string safeName = SanitizeBlobName(scopedLogical);

        return Path.Combine(_localRootPath!, safeContainer, safeName);
    }

    private async Task<byte[]?> TryReadAzureAsync(string logicalPath, CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;
        BlobServiceClient serviceClient =
            await _regionalClients!.GetArtifactsBlobServiceClientAsync(tenantId, cancellationToken).ConfigureAwait(false);
        string scopedBlobName = ArtifactBlobTenantPaths.PrefixWithTenant(_scopeProvider, logicalPath);
        BlobContainerClient container =
            serviceClient.GetBlobContainerClient(TenantReviewBoardCoverLogoBlobPaths.ContainerName.ToLowerInvariant());
        BlobClient blob = container.GetBlobClient(scopedBlobName);

        if (!await blob.ExistsAsync(cancellationToken).ConfigureAwait(false))
            return null;

        Response<BlobDownloadResult> response = await blob.DownloadContentAsync(cancellationToken).ConfigureAwait(false);
        return response.Value.Content.ToArray();
    }

    private static bool IsPng(byte[] logoBytes) =>
        logoBytes.Length >= 8 && logoBytes[0] == 0x89 && logoBytes[1] == 0x50;

    private static string SanitizeSegment(string segment) =>
        Path.GetInvalidFileNameChars().Aggregate(segment, (current, c) => current.Replace(c, '_')).Trim();

    private static string SanitizeBlobName(string blobName)
    {
        blobName = blobName.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        List<string> parts = blobName.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)
            .Select(SanitizeSegment)
            .Where(static s => s.Length > 0)
            .ToList();

        return parts.Count > 0 ? Path.Combine(parts.ToArray()) : "cover-logo.bin";
    }
}
