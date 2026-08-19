using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Chunking;
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

        ManifestChunkSummarizer sut = CreateSummarizer(summaryClient.Object, safeTokenLimit: 150);

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

    [Fact]
    public async Task MaybeSummarizeAsync_preserves_high_score_manifest_chunks_verbatim()
    {
        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        summaryClient
            .Setup(c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("summary bullets");

        ManifestChunkSummarizer sut = CreateSummarizer(summaryClient.Object, safeTokenLimit: 130);

        string heavyText = new('x', 400);
        IReadOnlyList<RetrievalHit> hits =
        [
            CreateManifestHit("critical", score: 0.99, text: heavyText),
            CreateManifestHit("expendable", score: 0.05, text: heavyText),
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Single(hit => hit.ChunkId == "critical").Text.Should().Be(heavyText);
        result.Single(hit => hit.ChunkId == "expendable").Text.Should().StartWith("[Summarized manifest chunk]");
    }

    [Fact]
    public async Task MaybeSummarizeAsync_does_not_summarize_non_manifest_corpus_hits()
    {
        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        ManifestChunkSummarizer sut = CreateSummarizer(summaryClient.Object, safeTokenLimit: 10);

        string heavyText = new('x', 400);
        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit
            {
                ChunkId = "policy",
                DocumentId = "doc-policy",
                CorpusKind = nameof(CorpusKind.PolicyPack),
                SourceType = "PolicyPackRule",
                SourceId = "rule-1",
                Title = "rule-1",
                Text = heavyText,
                Score = 0.5,
            },
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Should().BeSameAs(hits);
        summaryClient.Verify(
            c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task MaybeSummarizeAsync_when_disabled_returns_hits_unchanged()
    {
        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        IOptionsMonitor<ManifestChunkSummarizationOptions> options =
            new MockOptionsMonitor<ManifestChunkSummarizationOptions>(
                new ManifestChunkSummarizationOptions
                {
                    Enabled = false,
                    SafeTokenLimit = 10,
                });

        ManifestChunkSummarizer sut = new(summaryClient.Object, options);

        string heavyText = new('x', 400);
        IReadOnlyList<RetrievalHit> hits =
        [
            CreateManifestHit("only", score: 0.5, text: heavyText),
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Should().BeSameAs(hits);
        summaryClient.Verify(
            c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task MaybeSummarizeAsync_summarizes_selected_prefix_in_parallel()
    {
        int inFlight = 0;
        int maxInFlight = 0;
        object gate = new();

        Mock<IManifestChunkSummaryCompletionClient> summaryClient = new();
        summaryClient
            .Setup(c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (string _, CancellationToken ct) =>
            {
                lock (gate)
                {
                    inFlight++;
                    maxInFlight = Math.Max(maxInFlight, inFlight);
                }

                await Task.Delay(40, ct);

                lock (gate)
                {
                    inFlight--;
                }

                return "summary";
            });

        IOptionsMonitor<ManifestChunkSummarizationOptions> options =
            new MockOptionsMonitor<ManifestChunkSummarizationOptions>(
                new ManifestChunkSummarizationOptions
                {
                    Enabled = true,
                    SafeTokenLimit = 50,
                    MaxConcurrentSummaries = 4,
                });

        ManifestChunkSummarizer sut = new(summaryClient.Object, options);

        string heavyText = new('x', 400);
        IReadOnlyList<RetrievalHit> hits =
        [
            CreateManifestHit("a", score: 0.10, text: heavyText),
            CreateManifestHit("b", score: 0.20, text: heavyText),
            CreateManifestHit("c", score: 0.30, text: heavyText),
            CreateManifestHit("d", score: 0.40, text: heavyText),
        ];

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync(hits, CancellationToken.None);

        result.Should().HaveCount(4);
        result.Should().OnlyContain(hit => hit.Text!.StartsWith("[Summarized manifest chunk]", StringComparison.Ordinal));
        summaryClient.Verify(
            c => c.SummarizeChunkAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(4));
        maxInFlight.Should().BeGreaterThan(1);
    }

    [Fact]
    public void SelectSummarizationPrefix_stops_once_overage_is_covered()
    {
        string heavyText = new('x', 400);
        List<RetrievalHit> candidates =
        [
            CreateManifestHit("low", score: 0.1, text: heavyText),
            CreateManifestHit("mid", score: 0.5, text: heavyText),
            CreateManifestHit("high", score: 0.9, text: heavyText),
        ];

        int estimated = ManifestChunkSummarizer.EstimateTotalTokens(candidates);
        int safeLimit = estimated - TokenAwareContextBudget.EstimateTokenCount(heavyText) + 1;

        IReadOnlyList<RetrievalHit> prefix =
            ManifestChunkSummarizer.SelectSummarizationPrefix(candidates, estimated, safeLimit);

        prefix.Should().ContainSingle().Which.ChunkId.Should().Be("low");
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
                    MaxConcurrentSummaries = 4,
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
