using ArchLucid.Retrieval.Embedding;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class FakeEmbeddingServiceTests
{
    [Fact]
    public async Task EmbedAsync_returns_deterministic_32_dimension_vector()
    {
        FakeEmbeddingService sut = new();

        float[] first = await sut.EmbedAsync("architecture review", CancellationToken.None);
        float[] second = await sut.EmbedAsync("architecture review", CancellationToken.None);

        first.Should().HaveCount(32);
        first.Should().Equal(second);
    }

    [Fact]
    public async Task EmbedManyAsync_returns_one_vector_per_input()
    {
        FakeEmbeddingService sut = new();

        IReadOnlyList<float[]> vectors = await sut.EmbedManyAsync(["alpha", "beta"], CancellationToken.None);

        vectors.Should().HaveCount(2);
        vectors[0].Should().HaveCount(32);
        vectors[1].Should().HaveCount(32);
        vectors[0].Should().NotEqual(vectors[1]);
    }
}
