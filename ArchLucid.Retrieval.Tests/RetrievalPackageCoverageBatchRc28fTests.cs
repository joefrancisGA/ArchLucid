using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28f package-coverage batch: embedding drift guard edge cases and simple text chunker stride behavior.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28fTests
{
    [Fact]
    public void RetrievalEmbeddingDriftGuard_TryBuildDriftErrorMessage_returns_null_for_empty_index()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("text-embedding-3-small");
        identity.SetupGet(i => i.ExpectedDimension).Returns(1536);

        VectorIndexEmbeddingMetadata metadata = new("legacy-model", 768, ChunkCount: 0);

        RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, identity.Object).Should().BeNull();
    }

    [Fact]
    public void RetrievalEmbeddingDriftGuard_TryBuildDriftErrorMessage_returns_message_on_model_mismatch()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("text-embedding-3-small");
        identity.SetupGet(i => i.ExpectedDimension).Returns(1536);

        VectorIndexEmbeddingMetadata metadata = new("text-embedding-ada-002", 1536, ChunkCount: 8);

        string? message = RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, identity.Object);

        message.Should().Contain("embedding drift");
        message.Should().Contain("text-embedding-ada-002");
        message.Should().Contain("text-embedding-3-small");
    }

    [Fact]
    public void RetrievalEmbeddingDriftGuard_TryBuildDriftErrorMessage_throws_when_arguments_null()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        VectorIndexEmbeddingMetadata metadata = new("model", 1536, 1);

        FluentActions
            .Invoking(() => RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(null!, identity.Object))
            .Should()
            .Throw<ArgumentNullException>();

        FluentActions
            .Invoking(() => RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void SimpleTextChunker_Chunk_discards_whitespace_only_input()
    {
        SimpleTextChunker chunker = new();

        IReadOnlyList<string> chunks = chunker.Chunk("   \t\n  ");

        chunks.Should().BeEmpty();
    }

    [Fact]
    public void SimpleTextChunker_Chunk_advances_one_character_when_overlap_exceeds_max_chars()
    {
        SimpleTextChunker chunker = new();
        string text = new('x', 250);

        IReadOnlyList<string> chunks = chunker.Chunk(text, maxChars: 100, overlap: 100);

        chunks.Should().HaveCountGreaterThan(1);
        chunks[0].Should().HaveLength(100);
        chunks[1].Should().StartWith("x");
    }
}
