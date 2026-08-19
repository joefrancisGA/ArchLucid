namespace ArchLucid.Persistence.BlobStore;

/// <summary>
///     Persists large UTF-8 text payloads outside SQL (local files or Azure Blob). URIs are stored in SQL as pointers.
/// </summary>
public interface IArtifactBlobStore
{
    /// <summary>Writes content and returns an opaque URI (e.g. file:// or https://) suitable for <see cref="ReadAsync" />.</summary>
    Task<string> WriteAsync(string containerName, string blobName, string content, CancellationToken ct);

    /// <summary>Reads payload previously written; returns null if missing or unreadable.</summary>
    Task<string?> ReadAsync(string blobUri, CancellationToken ct);

    /// <summary>
    ///     When a blob already exists at the tenant-prefixed <paramref name="logicalBlobName" />, returns the same style
    ///     of URI as <see cref="WriteAsync" />; otherwise null. Used for content-addressed deduplication.
    /// </summary>
    Task<string?> TryGetExistingUriAsync(string containerName, string logicalBlobName, CancellationToken ct);
}
