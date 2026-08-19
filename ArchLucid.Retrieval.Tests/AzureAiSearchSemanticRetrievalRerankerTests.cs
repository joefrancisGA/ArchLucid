using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Reranking;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class AzureAiSearchSemanticRetrievalRerankerTests
{
    [Fact]
    public async Task RerankAsync_WhenDisabled_UsesPassThroughOrder()
    {
        List<RetrievalHit> candidates =
        [
            new() { ChunkId = "a", SourceId = "a", Title = "A", Text = "alpha", Score = 0.1 },
            new() { ChunkId = "b", SourceId = "b", Title = "B", Text = "beta", Score = 0.9 },
        ];

        AzureAiSearchSemanticRetrievalReranker sut = CreateSut(
            new RetrievalRerankingOptions { Enabled = false },
            searchConfigured: false);

        IReadOnlyList<RetrievalHit> result = await sut.RerankAsync("query", candidates, 1, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ChunkId.Should().Be("b");
    }

    [Fact]
    public async Task RerankAsync_WhenSearchNotConfigured_UsesLexicalFallback()
    {
        List<RetrievalHit> candidates =
        [
            new() { ChunkId = "a", SourceId = "a", Title = "Key Vault", Text = "secrets", Score = 0.2 },
            new() { ChunkId = "b", SourceId = "b", Title = "Other", Text = "unrelated", Score = 0.95 },
        ];

        AzureAiSearchSemanticRetrievalReranker sut = CreateSut(
            new RetrievalRerankingOptions { Enabled = true },
            searchConfigured: false);

        IReadOnlyList<RetrievalHit> result = await sut.RerankAsync("key vault rotation", candidates, 1, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ChunkId.Should().Be("a");
    }

    [Fact]
    public async Task RerankAsync_WhenSearchConfigured_DelegatesToClient()
    {
        List<RetrievalHit> candidates =
        [
            new() { ChunkId = "a", SourceId = "a", Title = "A", Text = "alpha", Score = 0.1 },
        ];

        Mock<IAzureSearchClient> client = new();
        client.Setup(static c => c.IsConfigured).Returns(true);
        client
            .Setup(c => c.SemanticRerankAsync("q", candidates, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<RetrievalHit>)[new RetrievalHit { ChunkId = "reranked", SourceId = "r", Title = "R", Text = "t", Score = 1 }]);

        AzureAiSearchSemanticRetrievalReranker sut = CreateSut(
            new RetrievalRerankingOptions { Enabled = true },
            client.Object);

        IReadOnlyList<RetrievalHit> result = await sut.RerankAsync("q", candidates, 1, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ChunkId.Should().Be("reranked");
    }

    private static AzureAiSearchSemanticRetrievalReranker CreateSut(
        RetrievalRerankingOptions options,
        bool searchConfigured)
    {
        Mock<IAzureSearchClient> client = new();
        client.Setup(static c => c.IsConfigured).Returns(searchConfigured);

        return CreateSut(options, client.Object);
    }

    private static AzureAiSearchSemanticRetrievalReranker CreateSut(
        RetrievalRerankingOptions options,
        IAzureSearchClient client)
    {
        IOptionsMonitor<RetrievalRerankingOptions> monitor = new MockOptionsMonitor<RetrievalRerankingOptions>(options);

        return new AzureAiSearchSemanticRetrievalReranker(
            client,
            new LexicalOverlapRetrievalReranker(),
            new PassThroughRetrievalReranker(),
            monitor);
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
