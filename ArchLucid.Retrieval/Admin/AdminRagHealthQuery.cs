using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

namespace ArchLucid.Retrieval.Admin;

/// <inheritdoc cref="IAdminRagHealthQuery" />
public sealed class AdminRagHealthQuery(
    IRetrievalDocumentIndexCatalog indexCatalog,
    IEmbeddingModelIdentity embeddingModelIdentity) : IAdminRagHealthQuery
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromHours(24);

    private readonly IRetrievalDocumentIndexCatalog _indexCatalog =
        indexCatalog ?? throw new ArgumentNullException(nameof(indexCatalog));

    private readonly IEmbeddingModelIdentity _embeddingModelIdentity =
        embeddingModelIdentity ?? throw new ArgumentNullException(nameof(embeddingModelIdentity));

    /// <inheritdoc />
    public AdminRagHealthResponse GetRagHealth()
    {
        DateTimeOffset staleBefore = TimeProvider.System.GetUtcNow().Subtract(StaleThreshold);
        int embeddingDimension = _embeddingModelIdentity.ExpectedDimension;

        AdminRagCorpusHealthItem[] corpora = _indexCatalog
            .GetCorpusFreshnessSummaries()
            .Select(summary => new AdminRagCorpusHealthItem
            {
                CorpusKind = summary.CorpusKind,
                ChunkCount = summary.DocumentCount,
                LastIndexedUtc = summary.LastIndexedUtc,
                EmbeddingDimension = embeddingDimension,
                IsStale = summary.LastIndexedUtc is null || summary.LastIndexedUtc < staleBefore,
            })
            .ToArray();

        return new AdminRagHealthResponse
        {
            EmbeddingModelId = _embeddingModelIdentity.ModelId,
            Corpora = corpora,
        };
    }
}
