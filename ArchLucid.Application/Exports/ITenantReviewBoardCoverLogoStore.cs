namespace ArchLucid.Application.Exports;

/// <summary>Persists and reads tenant-scoped review-board cover logos from blob storage.</summary>
public interface ITenantReviewBoardCoverLogoStore
{
    /// <summary>Uploads PNG/JPEG bytes for the current tenant scope.</summary>
    Task UploadAsync(byte[] logoBytes, CancellationToken cancellationToken);

    /// <summary>Returns logo bytes when configured for the current tenant; otherwise <see langword="null" />.</summary>
    Task<byte[]?> TryGetBytesAsync(CancellationToken cancellationToken);
}
