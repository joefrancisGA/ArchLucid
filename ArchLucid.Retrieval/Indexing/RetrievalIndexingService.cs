using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     <see cref="IRetrievalIndexingService" /> pipeline: <see cref="ITextChunker" /> →
///     <see cref="IEmbeddingService.EmbedManyAsync" /> (batched) → <see cref="RetrievalChunk" /> →
///     <see cref="IVectorIndex.UpsertChunksAsync" />.
/// </summary>
public sealed class RetrievalIndexingService(
    SimpleTextChunker defaultChunker,
    PolicyPackChunker policyPackChunker,
    PriorManifestChunker priorManifestChunker,
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex,
    IOptionsMonitor<RetrievalEmbeddingCapOptions> capOptions) : IRetrievalIndexingService
{
    private readonly SimpleTextChunker _defaultChunker =
        defaultChunker ?? throw new ArgumentNullException(nameof(defaultChunker));

    private readonly PolicyPackChunker _policyPackChunker =
        policyPackChunker ?? throw new ArgumentNullException(nameof(policyPackChunker));

    private readonly PriorManifestChunker _priorManifestChunker =
        priorManifestChunker ?? throw new ArgumentNullException(nameof(priorManifestChunker));

    /// <inheritdoc />
    public async Task IndexDocumentsAsync(IReadOnlyList<RetrievalDocument> documents, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(documents);

        if (documents.Count == 0)
            return;

        RetrievalEmbeddingCapOptions caps = capOptions.CurrentValue;
        int batchSize = Math.Clamp(caps.MaxTextsPerEmbeddingRequest, 1, 2048);
        int maxChunks = caps.MaxChunksPerIndexOperation;

        List<(RetrievalDocument Doc, IReadOnlyList<string> Split)> work = [];

        foreach (RetrievalDocument doc in documents)
        {
            ct.ThrowIfCancellationRequested();

            IReadOnlyList<string> split = SelectChunker(doc.CorpusKind).Chunk(doc.Content);

            if (split.Count == 0)
                continue;

            work.Add((doc, split));
        }

        int totalChunks = work.Sum(x => x.Split.Count);

        if (maxChunks > 0 && totalChunks > maxChunks)

            throw new InvalidOperationException(
                $"Embedding index operation would process {totalChunks} chunks, exceeding Retrieval:EmbeddingCaps:MaxChunksPerIndexOperation ({maxChunks}).");


        List<RetrievalChunk> chunks = [];

        foreach ((RetrievalDocument doc, IReadOnlyList<string> split) in work)
        {
            ct.ThrowIfCancellationRequested();

            List<float[]> embeddings = [];

            for (int offset = 0; offset < split.Count; offset += batchSize)
            {
                int take = Math.Min(batchSize, split.Count - offset);
                IReadOnlyList<string> batch = split.Skip(offset).Take(take).ToList();
                IReadOnlyList<float[]> batchEmbeddings = await embeddingService.EmbedManyAsync(batch, ct);

                if (batchEmbeddings.Count != batch.Count)
                    throw new InvalidOperationException("Embedding count must match chunk count.");

                embeddings.AddRange(batchEmbeddings);
            }

            chunks.AddRange(split.Select((t, i) => new RetrievalChunk
            {
                ChunkId = $"{doc.DocumentId}-chunk-{i}",
                DocumentId = doc.DocumentId,
                TenantId = doc.TenantId,
                WorkspaceId = doc.WorkspaceId,
                ProjectId = doc.ProjectId,
                RunId = doc.RunId,
                ManifestId = doc.ManifestId,
                CorpusKind = doc.CorpusKind,
                SourceType = doc.SourceType,
                SourceId = doc.SourceId,
                Title = doc.Title,
                Text = t,
                ChunkOrdinal = i,
                Embedding = embeddings[i],
                CreatedUtc = doc.CreatedUtc
            }));
        }

        if (chunks.Count > 0)
            await vectorIndex.UpsertChunksAsync(chunks, ct);
    }

    private ITextChunker SelectChunker(CorpusKind corpusKind) =>
        corpusKind switch
        {
            CorpusKind.PolicyPack => _policyPackChunker,
            CorpusKind.PriorManifest => _priorManifestChunker,
            _ => _defaultChunker,
        };
}
