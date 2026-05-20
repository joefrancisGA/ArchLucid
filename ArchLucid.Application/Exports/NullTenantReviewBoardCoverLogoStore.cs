namespace ArchLucid.Application.Exports;

/// <summary>
///     Used when artifact blob offload is disabled (<c>ArtifactLargePayload:BlobProvider=None</c>); upload is
///     not supported and lookups always return <see langword="null" /> so exports fall back to caller-supplied
///     or default branding.
/// </summary>
public sealed class NullTenantReviewBoardCoverLogoStore : ITenantReviewBoardCoverLogoStore
{
    /// <inheritdoc />
    public Task UploadAsync(byte[] logoBytes, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(logoBytes);

        throw new InvalidOperationException(
            "Tenant review-board cover logo storage is disabled (ArtifactLargePayload:BlobProvider=None). Configure Local or AzureBlob to upload cover logos.");
    }

    /// <inheritdoc />
    public Task<byte[]?> TryGetBytesAsync(CancellationToken cancellationToken) => Task.FromResult<byte[]?>(null);
}
