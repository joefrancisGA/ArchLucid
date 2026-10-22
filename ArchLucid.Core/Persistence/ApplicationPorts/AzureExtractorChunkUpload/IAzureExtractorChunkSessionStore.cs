namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Stages extractor ZIP fragments for assembly after the final chunk is uploaded.</summary>
public interface IAzureExtractorChunkSessionStore
{
    bool IsAvailable
    {
        get;
    }

    Task<Guid> CreateSessionAsync(AzureExtractorChunkSessionDescriptor descriptor, CancellationToken ct);

    Task StageChunkAsync(Guid sessionId, int chunkIndex, Stream chunkBody, CancellationToken ct);

    /// <summary>Commits staged blocks (Azure) or concatenates part files (Local) and returns metadata plus ZIP bytes.</summary>
    Task<(AzureExtractorChunkSessionMetadata Meta, byte[] Zip)> FinalizeAndReadAssemblyAsync(Guid sessionId, CancellationToken ct);

    Task DeleteSessionAsync(Guid sessionId, CancellationToken ct);
}
