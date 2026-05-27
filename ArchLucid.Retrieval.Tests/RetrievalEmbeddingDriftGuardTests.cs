using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalEmbeddingDriftGuardTests
{
    [Fact]
    public void TryBuildDriftErrorMessage_returns_null_when_metadata_matches_config()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("text-embedding-ada-002");
        identity.SetupGet(i => i.ExpectedDimension).Returns(1536);

        VectorIndexEmbeddingMetadata metadata = new("text-embedding-ada-002", 1536, 12);

        RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, identity.Object)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryBuildDriftErrorMessage_returns_actionable_message_on_dimension_mismatch()
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns("text-embedding-ada-002");
        identity.SetupGet(i => i.ExpectedDimension).Returns(1536);

        VectorIndexEmbeddingMetadata metadata = new("text-embedding-ada-002", 32, 4);

        string? message = RetrievalEmbeddingDriftGuard.TryBuildDriftErrorMessage(metadata, identity.Object);

        message.Should().Contain("embedding drift");
        message.Should().Contain("re-index");
    }
}
