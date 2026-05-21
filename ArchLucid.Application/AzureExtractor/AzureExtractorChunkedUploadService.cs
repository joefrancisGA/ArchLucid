using ArchLucid.Core.Scoping;

using ArchLucid.Persistence.AzureExtractorChunkUpload;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Orchestrates staged chunk uploads into <see cref="IAzureExtractorChunkSessionStore" /> plus ingest.</summary>
public sealed class AzureExtractorChunkedUploadService(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorChunkSessionStore chunkStore,
    IAzureExtractorIngestService ingestService,
    IOptions<AzureExtractorChunkUploadOptions> chunkOptions,
    ILogger<AzureExtractorChunkedUploadService> logger)
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorChunkSessionStore _chunkStore =
        chunkStore ?? throw new ArgumentNullException(nameof(chunkStore));

    private readonly IAzureExtractorIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IOptions<AzureExtractorChunkUploadOptions> _chunkOptions =
        chunkOptions ?? throw new ArgumentNullException(nameof(chunkOptions));

    private readonly ILogger<AzureExtractorChunkedUploadService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public bool ChunkedPipelineAvailable => _chunkStore.IsAvailable;

    public long MaxConfiguredChunkUploadBytes => _chunkOptions.Value.MaxChunkUploadBytes;

    public Task<Guid> BeginSessionAsync(string originalFileName, int totalChunks, long? declaredTotalBytes, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        AzureExtractorChunkSessionDescriptor descriptor = new(scope, originalFileName, totalChunks, declaredTotalBytes);

        return _chunkStore.CreateSessionAsync(descriptor, ct);
    }

    public Task UploadChunkAsync(Guid sessionId, int chunkIndex, Stream chunkBody, CancellationToken ct)

        => _chunkStore.StageChunkAsync(sessionId, chunkIndex, chunkBody, ct);

    public async Task<AzureExtractorIngestResult> CompleteSessionAsync(
        Guid sessionId,
        Guid? runId,
        CancellationToken ct,
        string? correlationId)
    {
        try
        {
            (AzureExtractorChunkSessionMetadata meta, byte[] zipBytes) = await _chunkStore.FinalizeAndReadAssemblyAsync(sessionId, ct);

            return await _ingestService.IngestZipBytesAsync(
                zipBytes,
                meta.OriginalFileName,
                runId,
                ct,
                correlationId,
                _chunkOptions.Value.MaxAssembledZipBytes);
        }

        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Chunked Azure extractor finalize or ingest failed for SessionId={SessionId:N}.", sessionId);

            throw;
        }

        finally
        {
            try
            {
                await _chunkStore.DeleteSessionAsync(sessionId, ct);
            }

            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed deleting Azure extractor chunk session staging SessionId={SessionId:N}.", sessionId);
            }
        }
    }
}
