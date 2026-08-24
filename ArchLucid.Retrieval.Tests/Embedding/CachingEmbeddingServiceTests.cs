using ArchLucid.Retrieval.Embedding;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Embedding;

[Trait("Category", "Unit")]
public sealed class CachingEmbeddingServiceTests
{
    [Fact]
    public async Task EmbedAsync_reuses_vector_for_identical_normalized_text()
    {
        Mock<IEmbeddingService> inner = new();
        float[] vector = [0.1f, 0.2f];
        inner
            .Setup(s => s.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(vector);

        using MemoryCache memoryCache = new(new MemoryCacheOptions { SizeLimit = 128 });
        CachingEmbeddingService sut = CreateSut(inner.Object, memoryCache);

        float[] first = await sut.EmbedAsync("hello\r\nworld", CancellationToken.None);
        float[] second = await sut.EmbedAsync("hello\nworld", CancellationToken.None);

        first.Should().BeSameAs(vector);
        second.Should().BeSameAs(vector);
        inner.Verify(s => s.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EmbedManyAsync_fills_cache_hits_and_misses()
    {
        Mock<IEmbeddingService> inner = new();
        float[] cachedVector = [1f];
        float[] missVector = [2f];

        using MemoryCache memoryCache = new(new MemoryCacheOptions { SizeLimit = 128 });
        string hitKey = CachingEmbeddingService.BuildCacheKey("hit", CreateModelIdentity());
        memoryCache.Set(hitKey, cachedVector, new MemoryCacheEntryOptions { Size = 1 });

        inner
            .Setup(s => s.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([missVector]);

        CachingEmbeddingService sut = CreateSut(inner.Object, memoryCache);

        IReadOnlyList<float[]> results = await sut.EmbedManyAsync(["hit", "miss"], CancellationToken.None);

        results.Should().HaveCount(2);
        results[0].Should().BeSameAs(cachedVector);
        results[1].Should().BeSameAs(missVector);
        inner.Verify(
            s => s.EmbedManyAsync(
                It.Is<IReadOnlyList<string>>(t => t.Count == 1 && t[0] == "miss"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EmbedAsync_does_not_reuse_cache_entry_after_embedding_model_identity_changes()
    {
        Mock<IEmbeddingService> inner = new();
        float[] firstVector = [0.1f, 0.2f];
        float[] secondVector = [0.3f, 0.4f];
        inner
            .SetupSequence(s => s.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(firstVector)
            .ReturnsAsync(secondVector);

        using MemoryCache memoryCache = new(new MemoryCacheOptions { SizeLimit = 128 });
        Mock<IEmbeddingModelIdentity> firstIdentity = CreateModelIdentityMock("text-embedding-3-small", 1536);
        CachingEmbeddingService firstSut = CreateSut(inner.Object, memoryCache, firstIdentity.Object);

        float[] first = await firstSut.EmbedAsync("same text", CancellationToken.None);

        first.Should().BeSameAs(firstVector);

        Mock<IEmbeddingModelIdentity> secondIdentity = CreateModelIdentityMock("text-embedding-3-large", 3072);
        CachingEmbeddingService secondSut = CreateSut(inner.Object, memoryCache, secondIdentity.Object);

        float[] second = await secondSut.EmbedAsync("same text", CancellationToken.None);

        second.Should().BeSameAs(secondVector);
        inner.Verify(s => s.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    private static CachingEmbeddingService CreateSut(
        IEmbeddingService inner,
        IMemoryCache memoryCache,
        IEmbeddingModelIdentity? modelIdentity = null)
    {
        EmbeddingContentHashCacheOptions options = new()
        {
            Enabled = true,
            AbsoluteExpirationSeconds = 600,
            MaxEntries = 128,
        };

        return new CachingEmbeddingService(
            inner,
            memoryCache,
            Options.Create(options).ToMonitor(),
            modelIdentity ?? CreateModelIdentity());
    }

    private static IEmbeddingModelIdentity CreateModelIdentity()
        => CreateModelIdentityMock("text-embedding-3-small", 1536).Object;

    private static Mock<IEmbeddingModelIdentity> CreateModelIdentityMock(string modelId, int dimension)
    {
        Mock<IEmbeddingModelIdentity> identity = new();
        identity.SetupGet(i => i.ModelId).Returns(modelId);
        identity.SetupGet(i => i.ExpectedDimension).Returns(dimension);

        return identity;
    }
}

internal static class OptionsMonitorTestExtensions
{
    public static IOptionsMonitor<T> ToMonitor<T>(this IOptions<T> options)
        where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.SetupGet(m => m.CurrentValue).Returns(options.Value);

        return monitor.Object;
    }
}
