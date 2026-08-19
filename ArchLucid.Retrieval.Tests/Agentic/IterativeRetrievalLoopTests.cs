using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Agentic;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Agentic;

[Trait("Category", "Unit")]
public sealed class IterativeRetrievalLoopTests
{
    [Fact]
    public async Task MaybeRetryAsync_when_disabled_returns_initial_hits_without_trace()
    {
        IterativeRetrievalLoop sut = CreateSut(new AdvancedRetrievalOptions { Enabled = false });

        RetrievalQuery query = BuildQuery();
        List<RetrievalHit> initialHits = [Hit("chunk-1", 0.9)];

        (IReadOnlyList<RetrievalHit> hits, IterativeRetrievalTraceState? trace) = await sut.MaybeRetryAsync(
            query,
            PassthroughPlan(),
            initialHits,
            (_, _, _) => Task.FromResult<IReadOnlyList<RetrievalHit>>([]),
            CancellationToken.None);

        hits.Should().BeSameAs(initialHits);
        trace.Should().BeNull();
    }

    [Fact]
    public async Task MaybeRetryAsync_when_sufficient_after_first_pass_returns_trace_with_one_round()
    {
        IterativeRetrievalLoop sut = CreateSut(
            new AdvancedRetrievalOptions
            {
                Enabled = true,
                EnableIterativeRetrieveCritiqueRetry = true,
                MaxIterativeRetrievalRounds = 3,
            });

        RetrievalQuery query = BuildQuery();
        List<RetrievalHit> initialHits = [Hit("chunk-1", 0.9), Hit("chunk-2", 0.8)];

        int searchCalls = 0;

        (IReadOnlyList<RetrievalHit> hits, IterativeRetrievalTraceState? trace) = await sut.MaybeRetryAsync(
            query,
            PassthroughPlan(),
            initialHits,
            (_, _, _) =>
            {
                searchCalls++;
                return Task.FromResult<IReadOnlyList<RetrievalHit>>([]);
            },
            CancellationToken.None);

        hits.Should().BeEquivalentTo(initialHits);
        trace.Should().NotBeNull();
        trace!.IterativeRetrievalRounds.Should().Be(1);
        searchCalls.Should().Be(0);
    }

    [Fact]
    public async Task MaybeRetryAsync_when_insufficient_merges_retry_hits_and_records_rounds()
    {
        IterativeRetrievalLoop sut = CreateSut(
            new AdvancedRetrievalOptions
            {
                Enabled = true,
                EnableIterativeRetrieveCritiqueRetry = true,
                MaxIterativeRetrievalRounds = 3,
            });

        RetrievalQuery query = BuildQuery();
        List<RetrievalHit> initialHits = [Hit("chunk-1", 0.4)];

        (IReadOnlyList<RetrievalHit> hits, IterativeRetrievalTraceState? trace) = await sut.MaybeRetryAsync(
            query,
            PassthroughPlan(),
            initialHits,
            (_, _, _) => Task.FromResult<IReadOnlyList<RetrievalHit>>([Hit("chunk-2", 0.95)]),
            CancellationToken.None);

        hits.Should().HaveCount(2);
        hits.Select(static h => h.ChunkId).Should().Contain(["chunk-1", "chunk-2"]);
        trace.Should().NotBeNull();
        trace!.IterativeRetrievalRounds.Should().BeGreaterThan(1);
        trace.IterativeCritiqueDecisionsJson.Should().NotBeNullOrWhiteSpace();
    }

    private static IterativeRetrievalLoop CreateSut(AdvancedRetrievalOptions options)
    {
        AgenticRetrievalQueryExpander expander = new(
            new HeuristicAgenticRetrievalCompletionClient(),
            new MockOptionsMonitor<AdvancedRetrievalOptions>(options),
            Mock.Of<ILogger<AgenticRetrievalQueryExpander>>());

        return new IterativeRetrievalLoop(
            new HeuristicAgenticRetrievalCompletionClient(),
            expander,
            new MockOptionsMonitor<AdvancedRetrievalOptions>(options),
            Mock.Of<ILogger<IterativeRetrievalLoop>>());
    }

    private static RetrievalQuery BuildQuery()
    {
        return new RetrievalQuery
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            QueryText = "network segmentation gaps",
            TopK = 8,
        };
    }

    private static AgenticRetrievalQueryPlan PassthroughPlan()
    {
        return new AgenticRetrievalQueryPlan
        {
            OriginalQueryText = "network segmentation gaps",
            EmbedText = "network segmentation gaps",
            RerankQueryText = "network segmentation gaps",
        };
    }

    private static RetrievalHit Hit(string chunkId, double score)
    {
        return new RetrievalHit
        {
            ChunkId = chunkId,
            DocumentId = "doc-1",
            Score = score,
            SourceType = "Manifest",
            SourceId = "manifest-1",
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
