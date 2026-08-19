using ArchLucid.Retrieval.Embedding;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Fail-fast host startup when in-memory index metadata disagrees with configured embedding model (TB-045).
/// </summary>
public sealed class RetrievalEmbeddingDriftStartupValidator(
    IEmbeddingModelIdentity embeddingModelIdentity,
    IVectorIndexEmbeddingMetadataProvider metadataProvider,
    ILogger<RetrievalEmbeddingDriftStartupValidator> logger) : IHostedService
{
    private readonly IEmbeddingModelIdentity _embeddingModelIdentity =
        embeddingModelIdentity ?? throw new ArgumentNullException(nameof(embeddingModelIdentity));

    private readonly ILogger<RetrievalEmbeddingDriftStartupValidator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IVectorIndexEmbeddingMetadataProvider _metadataProvider =
        metadataProvider ?? throw new ArgumentNullException(nameof(metadataProvider));

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        VectorIndexEmbeddingMetadata? metadata = _metadataProvider.GetEmbeddingMetadata();

        if (metadata is null)
            return Task.CompletedTask;

        string? driftMessage = RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, _embeddingModelIdentity);

        if (driftMessage is null)
            return Task.CompletedTask;

        if (_logger.IsEnabled(LogLevel.Error))

            _logger.LogError(
                "Retrieval embedding drift guard blocked startup: IndexModelId={IndexModelId}, IndexDimension={IndexDimension}, ConfigModelId={ConfigModelId}, ConfigDimension={ConfigDimension}, ChunkCount={ChunkCount}",
                metadata.ModelId,
                metadata.Dimension,
                _embeddingModelIdentity.ModelId,
                _embeddingModelIdentity.ExpectedDimension,
                metadata.ChunkCount);


        throw new InvalidOperationException(driftMessage);
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
