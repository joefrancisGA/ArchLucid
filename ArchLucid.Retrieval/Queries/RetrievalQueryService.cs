using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

namespace ArchLucid.Retrieval.Queries;

/// <summary>
///     <see cref="IRetrievalQueryService" /> implementation: embed query text, delegate to <see cref="IVectorIndex" />.
/// </summary>
public sealed class RetrievalQueryService(
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex) : IRetrievalQueryService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentException.ThrowIfNullOrWhiteSpace(query.QueryText);

        long startTicks = Stopwatch.GetTimestamp();

        float[] embedding = await embeddingService.EmbedAsync(query.QueryText, ct);
        IReadOnlyList<RetrievalHit> hits = await vectorIndex.SearchAsync(query, embedding, ct);

        double durationMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
        ArchLucidInstrumentation.RecordRagRetrievalSearch(durationMilliseconds, hits, query.TenantId);

        return hits;
    }
}
