namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>
///     Used when artifact blob offload is disabled (<c>ArtifactLargePayload:BlobProvider=None</c>); uploads are
///     not supported and lookups always return <see langword="null" />.
/// </summary>
public sealed class NullTenantBrandAssetBlobStore : ITenantBrandAssetBlobStore
{
    /// <inheritdoc />
    public Task<string> WriteAsync(
        Guid assetId,
        string fileExtension,
        string mimeType,
        byte[] assetBytes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assetBytes);

        throw new InvalidOperationException(
            "Tenant brand asset storage is disabled (ArtifactLargePayload:BlobProvider=None). Configure Local or AzureBlob to upload brand assets.");
    }

    /// <inheritdoc />
    public Task<byte[]?> TryReadAsync(string storageReference, CancellationToken cancellationToken) =>
        Task.FromResult<byte[]?>(null);
}
