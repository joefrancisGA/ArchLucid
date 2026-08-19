using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class InMemoryVectorIndexPlatformCorpusTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task SearchAsync_IncludePlatformCorporaFalse_ExcludesPlatformChunks()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
        [
            MakeTenantChunk("tenant", [1f, 0f]),
            MakePlatformChunk("platform", [1f, 0f]),
        ],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery(includePlatform: false);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.ChunkId.Should().Be("tenant");
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorporaTrue_IncludesPlatformChunks()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
        [
            MakeTenantChunk("tenant", [0f, 1f]),
            MakePlatformChunk("platform", [1f, 0f]),
        ],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery(includePlatform: true);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().NotBeEmpty();
        hits.Should().Contain(h => h.ChunkId == "platform");
        hits.OrderByDescending(h => h.Score).First().ChunkId.Should().Be("platform");
    }

    private static RetrievalQuery BaseQuery(bool includePlatform) => new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId,
        QueryText = "policy",
        TopK = 8,
        IncludePlatformCorpora = includePlatform,
    };

    private static RetrievalChunk MakeTenantChunk(string chunkId, float[] embedding) => new()
    {
        ChunkId = chunkId,
        DocumentId = chunkId,
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId,
        CorpusKind = CorpusKind.TenantManifest,
        SourceType = "Manifest",
        SourceId = chunkId,
        Title = chunkId,
        Text = chunkId,
        ChunkOrdinal = 0,
        Embedding = embedding,
        EmbeddingModelId = "test-model",
        EmbeddingDimension = embedding.Length,
    };

    private static RetrievalChunk MakePlatformChunk(string chunkId, float[] embedding) => new()
    {
        ChunkId = chunkId,
        DocumentId = chunkId,
        TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
        WorkspaceId = Guid.Empty,
        ProjectId = Guid.Empty,
        CorpusKind = CorpusKind.PlatformDoc,
        SourceType = "PlatformDoc",
        SourceId = chunkId,
        Title = chunkId,
        Text = chunkId,
        ChunkOrdinal = 0,
        Embedding = embedding,
        EmbeddingModelId = "test-model",
        EmbeddingDimension = embedding.Length,
    };
}
