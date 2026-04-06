using ArchiForge.Retrieval.Chunking;
using ArchiForge.Retrieval.Embedding;
using ArchiForge.Retrieval.Indexing;
using ArchiForge.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchiForge.Retrieval.Tests;

/// <summary>
/// <see cref="RetrievalIndexingService"/> embedding batching and chunk caps.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalIndexingServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task IndexDocumentsAsync_SplitsEmbedManyIntoBatchesPerCap()
    {
        Mock<ITextChunker> chunker = new();
        chunker
            .Setup(c => c.Chunk(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(["a", "b", "c", "d", "e"]);

        List<int> batchSizes = [];
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<string>, CancellationToken>((texts, _) => batchSizes.Add(texts.Count))
            .ReturnsAsync((IReadOnlyList<string> texts, CancellationToken _) =>
                texts.Select(_ => new float[4]).ToList());

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 2, MaxChunksPerIndexOperation = 0 });

        InMemoryVectorIndex index = new();
        RetrievalIndexingService sut = new(
            chunker.Object,
            embeddings.Object,
            index,
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d1",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Content = "ignored-by-mock-chunker",
            CreatedUtc = DateTime.UtcNow,
        };

        await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        batchSizes.Should().Equal(2, 2, 1);
    }

    [Fact]
    public async Task IndexDocumentsAsync_WhenTotalChunksExceedsCap_Throws()
    {
        Mock<ITextChunker> chunker = new();
        chunker
            .Setup(c => c.Chunk(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(["a", "b", "c", "d"]);

        Mock<IEmbeddingService> embeddings = new();

        Mock<IOptionsMonitor<RetrievalEmbeddingCapOptions>> caps = new();
        caps.Setup(m => m.CurrentValue).Returns(
            new RetrievalEmbeddingCapOptions { MaxTextsPerEmbeddingRequest = 16, MaxChunksPerIndexOperation = 3 });

        RetrievalIndexingService sut = new(
            chunker.Object,
            embeddings.Object,
            new InMemoryVectorIndex(),
            caps.Object);

        RetrievalDocument doc = new()
        {
            DocumentId = "d1",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Content = "x",
            CreatedUtc = DateTime.UtcNow,
        };

        Func<Task> act = async () => await sut.IndexDocumentsAsync([doc], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*MaxChunksPerIndexOperation*");
    }
}
