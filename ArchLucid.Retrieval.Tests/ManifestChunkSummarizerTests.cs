using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.Summarization;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class ManifestChunkSummarizerTests
{
    [Fact]
    public async Task MaybeSummarizeAsync_when_under_token_limit_does_not_call_summary_client()
    {
        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        ManifestChunkSummarizer sut = CreateSummarizer(summaryClient.Object, safeTokenLimit: 10_000);

        IReadOnlyList<RetrievalHit> hits =
        [
            CreateManifestHit("chunk-a", score: 0.9, text: "small manifest excerpt"),
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Should().BeSameAs(hits);
        summaryClient.Verify(
            c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task MaybeSummarizeAsync_when_over_token_limit_summarizes_lowest_score_manifest_chunks()
    {
        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        summaryClient
            .Setup(c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("summary bullets");

        ManifestChunkSummarizer sut = CreateSummarizer(summaryClient.Object, safeTokenLimit: 50);

        string heavyText = new('x', 400);
        IReadOnlyList<RetrievalHit> hits =
        [
            CreateManifestHit("high", score: 0.95, text: heavyText),
            CreateManifestHit("low", score: 0.10, text: heavyText),
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Single(hit => hit.ChunkId == "high").Text.Should().Be(heavyText);
        result.Single(hit => hit.ChunkId == "low").Text.Should().StartWith("[Summarized manifest chunk]");
        summaryClient.Verify(
            c => c.SummarizeChunkAsync(heavyText, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    private static ManifestChunkSummarizer CreateSummarizer(
        IManifestChunkSummaryCompletionClient summaryClient,
        int safeTokenLimit)
    {
        IOptionsMonitor<ManifestChunkSummarizationOptions> options =
            new MockOptionsMonitor<ManifestChunkSummarizationOptions>(
                new ManifestChunkSummarizationOptions
                {
                    Enabled = true,
                    SafeTokenLimit = safeTokenLimit,
                });

        return new ManifestChunkSummarizer(summaryClient, options);
    }

    private static RetrievalHit CreateManifestHit(string chunkId, double score, string text)
    {
        return new RetrievalHit
        {
            ChunkId = chunkId,
            DocumentId = "doc-1",
            CorpusKind = nameof(CorpusKind.PriorManifest),
            SourceType = "PriorManifestDecision",
            SourceId = chunkId,
            Title = chunkId,
            Text = text,
            Score = score,
        };
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
