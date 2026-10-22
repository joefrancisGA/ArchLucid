using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalEmbeddingDriftStartupValidatorTests
{
    [Fact]
    public async Task StartAsync_throws_when_index_metadata_disagrees_with_config()
    {
        InMemoryVectorIndex index = new();
        await index.UpsertChunksAsync(
            [SampleChunk("c1", "old-model", 32)],
            CancellationToken.None);

        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("new-model");
        identity.SetupGet(i => i.ExpectedDimension).Returns(32);

        RetrievalEmbeddingDriftStartupValidator sut = new(
            identity.Object,
            index,
            NullLogger<RetrievalEmbeddingDriftStartupValidator>.Instance);

        Func<Task> act = async () => await sut.StartAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*embedding drift*");
    }

    [Fact]
    public async Task StartAsync_succeeds_when_index_is_empty()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("fake-local");
        identity.SetupGet(i => i.ExpectedDimension).Returns(32);

        RetrievalEmbeddingDriftStartupValidator sut = new(
            identity.Object,
            new InMemoryVectorIndex(),
            NullLogger<RetrievalEmbeddingDriftStartupValidator>.Instance);

        await sut.StartAsync(CancellationToken.None);
    }

    private static RetrievalChunk SampleChunk(string chunkId, string modelId, int dimension)
    {
        float[] embedding = new float[dimension];
        embedding[0] = 1f;

        return new RetrievalChunk
        {
            ChunkId = chunkId,
            DocumentId = "d",
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SourceType = "Test",
            SourceId = chunkId,
            Title = chunkId,
            Text = chunkId,
            ChunkOrdinal = 0,
            Embedding = embedding,
            EmbeddingModelId = modelId,
            EmbeddingDimension = dimension,
        };
    }
}
