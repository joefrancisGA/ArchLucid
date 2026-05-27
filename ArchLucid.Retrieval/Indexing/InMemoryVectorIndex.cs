using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;

using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Thread-safe in-memory <see cref="IVectorIndex" /> using cosine similarity over stored embeddings (dev/tests or
///     single-node deployments).
/// </summary>
/// <remarks>
///     Replaces existing rows by <see cref="RetrievalChunk.ChunkId" /> on upsert. Filters require exact
///     tenant/workspace/project match; optional run/manifest must match when provided.
/// </remarks>
public sealed class InMemoryVectorIndex : IVectorIndex, IVectorIndexEmbeddingMetadataProvider
{
    private const int MaxChunks = 10_000;

    private readonly List<RetrievalChunk> _chunks = [];
    private readonly Lock _sync = new();

    private string? _indexEmbeddingModelId;
    private int _indexEmbeddingDimension;

    /// <inheritdoc />
    public Task RemoveChunksForDocumentAsync(
        string documentId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(documentId);
        _ = ct;

        lock (_sync)
        {
            _chunks.RemoveAll(chunk =>
                string.Equals(chunk.DocumentId, documentId, StringComparison.Ordinal)
                && chunk.TenantId == tenantId
                && chunk.WorkspaceId == workspaceId
                && chunk.ProjectId == projectId);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task UpsertChunksAsync(IReadOnlyList<RetrievalChunk> chunks, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(chunks);

        lock (_sync)
        {
            foreach (RetrievalChunk chunk in chunks)
            {
                ValidateAndApplyIndexMetadata(chunk);
                _chunks.RemoveAll(x => x.ChunkId == chunk.ChunkId);
                _chunks.Add(chunk);
            }

            if (_chunks.Count > MaxChunks)
                _chunks.RemoveRange(0, _chunks.Count - MaxChunks);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalHit>> SearchAsync(
        RetrievalQuery query,
        float[] queryEmbedding,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(queryEmbedding);

        lock (_sync)
        {
            List<RetrievalHit> hits = [];

            foreach (RetrievalChunk chunk in _chunks)
            {
                if (!MatchesQueryScope(chunk, query))
                    continue;

                if (!EmbeddingDimensionsCompatible(queryEmbedding, chunk))
                    continue;

                hits.Add(
                    new RetrievalHit
                    {
                        ChunkId = chunk.ChunkId,
                        DocumentId = chunk.DocumentId,
                        CorpusKind = chunk.CorpusKind.ToString(),
                        SourceType = chunk.SourceType,
                        SourceId = chunk.SourceId,
                        Title = chunk.Title,
                        Text = chunk.Text,
                        Score = Cosine(queryEmbedding, chunk.Embedding),
                        DecisionId = chunk.DecisionId,
                        FindingId = chunk.FindingId
                    });
            }

            IReadOnlyList<RetrievalHit> ranked = hits
                .OrderByDescending(x => x.Score)
                .Take(query.TopK)
                .ToList();

            return Task.FromResult(ranked);
        }
    }

    /// <inheritdoc />
    public VectorIndexEmbeddingMetadata? GetEmbeddingMetadata()
    {
        lock (_sync)
        {
            if (_chunks.Count == 0 || string.IsNullOrWhiteSpace(_indexEmbeddingModelId) || _indexEmbeddingDimension <= 0)
                return null;

            return new VectorIndexEmbeddingMetadata(_indexEmbeddingModelId, _indexEmbeddingDimension, _chunks.Count);
        }
    }

    private void ValidateAndApplyIndexMetadata(RetrievalChunk chunk)
    {
        if (string.IsNullOrWhiteSpace(chunk.EmbeddingModelId) || chunk.EmbeddingDimension <= 0)
            throw new InvalidOperationException(
                $"Retrieval chunk '{chunk.ChunkId}' is missing EmbeddingModelId or EmbeddingDimension metadata.");

        if (_indexEmbeddingModelId is null)
        {
            _indexEmbeddingModelId = chunk.EmbeddingModelId;
            _indexEmbeddingDimension = chunk.EmbeddingDimension;
            return;
        }

        if (!string.Equals(_indexEmbeddingModelId, chunk.EmbeddingModelId, StringComparison.OrdinalIgnoreCase)
            || _indexEmbeddingDimension != chunk.EmbeddingDimension)
        {
            throw new InvalidOperationException(
                "Cannot upsert retrieval chunks with mixed embedding model identity into the same in-memory index.");
        }
    }

    private static bool EmbeddingDimensionsCompatible(float[] queryEmbedding, RetrievalChunk chunk)
    {
        int chunkDimension = chunk.EmbeddingDimension > 0 ? chunk.EmbeddingDimension : chunk.Embedding.Length;

        if (queryEmbedding.Length == chunkDimension)
            return true;

        ArchLucidInstrumentation.RecordRetrievalEmbeddingDimensionMismatch();
        return false;
    }

    private static double Cosine(float[] a, float[] b)
    {
        if (a.Length != b.Length || a.Length == 0)
        {
            ArchLucidInstrumentation.RecordRetrievalEmbeddingDimensionMismatch();
            return 0;
        }

        double dot = 0;
        double magA = 0;
        double magB = 0;

        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        if (magA == 0 || magB == 0)
            return 0;

        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }

    private static bool MatchesQueryScope(RetrievalChunk chunk, RetrievalQuery query)
    {
        bool tenantMatch = chunk.TenantId == query.TenantId
            && chunk.WorkspaceId == query.WorkspaceId
            && chunk.ProjectId == query.ProjectId
            && (!query.RunId.HasValue || chunk.RunId == query.RunId)
            && (!query.ManifestId.HasValue || chunk.ManifestId == query.ManifestId);

        if (!tenantMatch && !query.IncludePlatformCorpora)
            return false;

        if (tenantMatch)
            return true;

        if (chunk.TenantId != CorpusKindSentinels.PlatformSentinelTenantId)
            return false;

        if (chunk.CorpusKind != CorpusKind.PolicyPack)
            return true;

        return MatchesAssignedPolicyPack(chunk, query);
    }

    private static bool MatchesAssignedPolicyPack(RetrievalChunk chunk, RetrievalQuery query)
    {
        HashSet<string>? allowed = query.AllowedPolicyPackRulePackIds;

        // TB-048: null assignment list must not expose platform policy-pack corpora.
        if (allowed is null || allowed.Count == 0)
            return false;

        if (string.IsNullOrWhiteSpace(chunk.PolicyPackRulePackId))
            return false;

        return allowed.Contains(chunk.PolicyPackRulePackId);
    }
}
