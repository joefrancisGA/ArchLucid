namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Placeholder when blob staging is disabled (<see cref="BlobStore.ArtifactLargePayloadOptions.BlobProvider" /> None).</summary>
public sealed class NullAzureExtractorChunkSessionStore : IAzureExtractorChunkSessionStore
{
    public bool IsAvailable => false;

    public Task<Guid> CreateSessionAsync(AzureExtractorChunkSessionDescriptor descriptor, CancellationToken ct)

        => Task.FromException<Guid>(
            new InvalidOperationException(
                "Azure extractor chunked upload requires ArtifactLargePayload BlobProvider AzureBlob or Local with reachable storage."));

    public Task StageChunkAsync(Guid sessionId, int chunkIndex, Stream chunkBody, CancellationToken ct)

        => Task.FromException(
            new InvalidOperationException(
                "Azure extractor chunked upload requires ArtifactLargePayload BlobProvider AzureBlob or Local with reachable storage."));

    public Task<(AzureExtractorChunkSessionMetadata Meta, byte[] Zip)> FinalizeAndReadAssemblyAsync(Guid sessionId, CancellationToken ct)

        => Task.FromException<(AzureExtractorChunkSessionMetadata Meta, byte[] Zip)>(
            new InvalidOperationException(
                "Azure extractor chunked upload requires ArtifactLargePayload BlobProvider AzureBlob or Local with reachable storage."));

    public Task DeleteSessionAsync(Guid sessionId, CancellationToken ct) => Task.CompletedTask;
}
