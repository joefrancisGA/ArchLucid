using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
/// <see cref="RetrievalQueryService"/> embeds query text then delegates to <see cref="IVectorIndex"/>; covers empty index, ranking order, TopK, and validation.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RetrievalQueryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task SearchAsync_EmptyIndex_ReturnsNoHits()
    {
        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("hello", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        InMemoryVectorIndex index = new();
        RetrievalQueryService sut = CreateService(embeddings.Object, index);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(
            new RetrievalQuery
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                QueryText = "hello",
                TopK = 8
            },
            CancellationToken.None);

        hits.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenEmbeddingIgnoresBudget_CancelsViaOverallTimeout()
    {
        Mock<IEmbeddingService> embeddings = new();
        embeddings
            .Setup(e => e.EmbedAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (string _, CancellationToken token) =>
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, token);
                return new float[] { 1f };
            });

        RetrievalQueryService sut = CreateService(
            embeddings.Object,
            new InMemoryVectorIndex(),
            queryBudget: new RetrievalQueryBudgetOptions { OverallTimeoutSeconds = 5 });

        Func<Task> act = async () => await sut.SearchAsync(ScopedQuery("slow", topK: 8), CancellationToken.None);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SearchAsync_OrdersHitsByScoreDescending()
    {
        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("q", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        InMemoryVectorIndex index = new();
        await index.UpsertChunksAsync(
            [
                Chunk("c-low", [0f, 1f, 0f], "low"),
                Chunk("c-high", [1f, 0f, 0f], "high"),
                Chunk("c-mid", [1f, 1f, 0f], "mid"),
                Chunk("c-opp", [-1f, 0f, 0f], "opp")
            ],
            CancellationToken.None);

        RetrievalQueryService sut = CreateService(embeddings.Object, index);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(
            ScopedQuery("q", topK: 10),
            CancellationToken.None);

        hits.Should().HaveCount(4);
        hits.Select(h => h.ChunkId).Should().ContainInOrder("c-high", "c-mid", "c-low", "c-opp");
        hits[0].Score.Should().BeGreaterThan(hits[1].Score);
        hits[1].Score.Should().BeGreaterThan(hits[2].Score);
        hits[2].Score.Should().BeGreaterThan(hits[3].Score);
    }

    [Fact]
    public async Task SearchAsync_RespectsTopK()
    {
        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("q", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        InMemoryVectorIndex index = new();
        await index.UpsertChunksAsync(
            [
                Chunk("a", [0f, 1f, 0f], "a"),
                Chunk("b", [1f, 1f, 0f], "b"),
                Chunk("c", [1f, 0f, 0f], "c")
            ],
            CancellationToken.None);

        RetrievalQueryService sut = CreateService(embeddings.Object, index);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(
            ScopedQuery("q", topK: 2),
            CancellationToken.None);

        hits.Should().HaveCount(2);
        hits[0].ChunkId.Should().Be("c");
        hits[1].ChunkId.Should().Be("b");
        hits[0].Score.Should().BeGreaterThan(hits[1].Score);
    }

    [Fact]
    public async Task SearchAsync_PassesEmbeddingFromServiceToVectorIndex()
    {
        Mock<IEmbeddingService> embeddings = new();
        Mock<IVectorIndex> index = new();
        float[] expected = [0.1f, 0.2f, 0.3f];
        embeddings.Setup(e => e.EmbedAsync("needle", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        RetrievalQuery query = ScopedQuery("needle", topK: 5);
        index.Setup(i => i.SearchAsync(
                It.Is<RetrievalQuery>(q => q.QueryText == query.QueryText && q.TopK == query.TopK),
                expected,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RetrievalQueryService sut = CreateService(embeddings.Object, index.Object);

        await sut.SearchAsync(query, CancellationToken.None);

        index.Verify(
            i => i.SearchAsync(
                It.Is<RetrievalQuery>(q => q.QueryText == query.QueryText && q.TopK == query.TopK),
                expected,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SearchAsync_NullQuery_ThrowsArgumentNullException()
    {
        RetrievalQueryService sut = CreateService(new Mock<IEmbeddingService>().Object, new InMemoryVectorIndex());

        Func<Task> act = async () => await sut.SearchAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task SearchAsync_BlankQueryText_ThrowsArgumentException()
    {
        RetrievalQueryService sut = CreateService(new Mock<IEmbeddingService>().Object, new InMemoryVectorIndex());

        Func<Task> act = async () =>
            await sut.SearchAsync(
                new RetrievalQuery
                {
                    TenantId = TenantId,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    QueryText = "   "
                },
                CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SearchAsync_EmptyTenantId_ThrowsArgumentException()
    {
        RetrievalQueryService sut = CreateService(new Mock<IEmbeddingService>().Object, new InMemoryVectorIndex());

        Func<Task> act = async () =>
            await sut.SearchAsync(
                new RetrievalQuery
                {
                    TenantId = Guid.Empty,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    QueryText = "hello",
                },
                CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*TenantId is required*");
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorpora_ResolvesAssignedRulePackIdsBeforeSearch()
    {
        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("policy", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        Mock<IVectorIndex> index = new();
        RetrievalQuery? capturedQuery = null;
        index.Setup(i => i.SearchAsync(It.IsAny<RetrievalQuery>(), queryVector, It.IsAny<CancellationToken>()))
            .Callback<RetrievalQuery, float[], CancellationToken>((query, _, _) => capturedQuery = query)
            .ReturnsAsync([]);

        HashSet<string> assigned = new(StringComparer.OrdinalIgnoreCase) { "pack-a" };
        RetrievalQueryService sut = CreateService(embeddings.Object, index.Object, assigned);

        await sut.SearchAsync(
            new RetrievalQuery
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                QueryText = "policy",
                IncludePlatformCorpora = true,
            },
            CancellationToken.None);

        capturedQuery.Should().NotBeNull();
        capturedQuery!.AllowedPolicyPackRulePackIds.Should().BeEquivalentTo(assigned);
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorpora_OverlapsPolicyPackResolveWithQueryExpand()
    {
        TaskCompletionSource resolveGate = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource expandGate = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource bothStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        int inFlight = 0;

        Mock<IPolicyPackResolver> policyPackResolver = new();
        policyPackResolver
            .Setup(r => r.ResolveAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .Returns(async (Guid _, Guid _, Guid _, CancellationToken ct) =>
            {
                if (Interlocked.Increment(ref inFlight) == 2)
                    bothStarted.TrySetResult();

                await resolveGate.Task.WaitAsync(ct);
                Interlocked.Decrement(ref inFlight);

                return BuildEffectivePackSet(["pack-a"]);
            });

        Mock<IAgenticRetrievalQueryExpander> expander = new();
        expander
            .Setup(e => e.ExpandAsync("policy", It.IsAny<CancellationToken>()))
            .Returns(async (string queryText, CancellationToken ct) =>
            {
                if (Interlocked.Increment(ref inFlight) == 2)
                    bothStarted.TrySetResult();

                await expandGate.Task.WaitAsync(ct);
                Interlocked.Decrement(ref inFlight);

                return new AgenticRetrievalQueryPlan
                {
                    OriginalQueryText = queryText,
                    RerankQueryText = queryText,
                    EmbedText = queryText,
                };
            });

        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("policy", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        Mock<IVectorIndex> index = new();
        index.Setup(i => i.SearchAsync(It.IsAny<RetrievalQuery>(), queryVector, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RetrievalQueryService sut = CreateService(
            embeddings.Object,
            index.Object,
            policyPackResolver: policyPackResolver.Object,
            queryExpander: expander.Object);

        Task<IReadOnlyList<RetrievalHit>> searchTask = sut.SearchAsync(
            new RetrievalQuery
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                QueryText = "policy",
                IncludePlatformCorpora = true,
            },
            CancellationToken.None);

        await bothStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        resolveGate.TrySetResult();
        expandGate.TrySetResult();

        IReadOnlyList<RetrievalHit> hits = await searchTask.WaitAsync(TimeSpan.FromSeconds(5));
        hits.Should().BeEmpty();

        policyPackResolver.Verify(
            r => r.ResolveAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()),
            Times.Once);
        expander.Verify(e => e.ExpandAsync("policy", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchAsync_SkipQueryExpansion_DoesNotCallExpander()
    {
        Mock<IAgenticRetrievalQueryExpander> expander = new();
        Mock<IEmbeddingService> embeddings = new();
        float[] queryVector = [1f, 0f, 0f];
        embeddings.Setup(e => e.EmbedAsync("hello", It.IsAny<CancellationToken>()))
            .ReturnsAsync(queryVector);

        InMemoryVectorIndex index = new();
        RetrievalQueryService sut = CreateService(embeddings.Object, index, queryExpander: expander.Object);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(
            new RetrievalQuery
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                QueryText = "hello",
                TopK = 8,
                SkipQueryExpansion = true,
                SkipReranking = true,
            },
            CancellationToken.None);

        hits.Should().BeEmpty();
        expander.Verify(e => e.ExpandAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static RetrievalQueryService CreateService(
        IEmbeddingService embeddingService,
        IVectorIndex vectorIndex,
        HashSet<string>? assignedRulePackIds = null,
        bool recordPerTenantTags = false,
        RetrievalQueryBudgetOptions? queryBudget = null,
        IPolicyPackResolver? policyPackResolver = null,
        IAgenticRetrievalQueryExpander? queryExpander = null)
    {
        IPolicyPackResolver resolvedPolicyPackResolver;

        if (policyPackResolver is null)
        {
            Mock<IPolicyPackResolver> policyPackResolverMock = new();
            policyPackResolverMock
                .Setup(r => r.ResolveAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(BuildEffectivePackSet(assignedRulePackIds ?? []));
            resolvedPolicyPackResolver = policyPackResolverMock.Object;
        }
        else
        {
            resolvedPolicyPackResolver = policyPackResolver;
        }

        IOptionsMonitor<PolicyPackCorpusIndexerOptions> options =
            new MockOptionsMonitor<PolicyPackCorpusIndexerOptions>(new PolicyPackCorpusIndexerOptions());

        AssignedPolicyPackRulePackIdResolver assignedResolver =
            new(resolvedPolicyPackResolver, options);

        IOptionsMonitor<RetrievalTelemetryOptions> telemetryOptions =
            new MockOptionsMonitor<RetrievalTelemetryOptions>(
                new RetrievalTelemetryOptions { RecordPerTenantTags = recordPerTenantTags });

        IOptionsMonitor<RetrievalRerankingOptions> rerankingOptions =
            new MockOptionsMonitor<RetrievalRerankingOptions>(new RetrievalRerankingOptions { Enabled = false });

        PassThroughRetrievalReranker passThrough = new();
        IAgenticRetrievalQueryExpander resolvedExpander;

        if (queryExpander is null)
        {
            HeuristicAgenticRetrievalCompletionClient completionClient = new();
            resolvedExpander = new AgenticRetrievalQueryExpander(
                completionClient,
                new MockOptionsMonitor<AdvancedRetrievalOptions>(new AdvancedRetrievalOptions { Enabled = false }),
                Mock.Of<Microsoft.Extensions.Logging.ILogger<AgenticRetrievalQueryExpander>>());
        }
        else
        {
            resolvedExpander = queryExpander;
        }

        NullGraphRagNeighborExpander graphExpander = new();

        HeuristicAgenticRetrievalCompletionClient iterativeCompletionClient = new();

        IOptionsMonitor<AdvancedRetrievalOptions> advancedOptions =
            new MockOptionsMonitor<AdvancedRetrievalOptions>(new AdvancedRetrievalOptions { Enabled = false });

        IterativeRetrievalLoop iterativeLoop = new(
            iterativeCompletionClient,
            resolvedExpander,
            advancedOptions,
            Mock.Of<Microsoft.Extensions.Logging.ILogger<IterativeRetrievalLoop>>());

        return new RetrievalQueryService(
            embeddingService,
            vectorIndex,
            passThrough,
            assignedResolver,
            new NoOpManifestChunkSummarizer(),
            resolvedExpander,
            graphExpander,
            iterativeLoop,
            telemetryOptions,
            rerankingOptions,
            advancedOptions,
            new MockOptionsMonitor<RetrievalQueryBudgetOptions>(queryBudget ?? new RetrievalQueryBudgetOptions()));
    }

    private static EffectivePolicyPackSet BuildEffectivePackSet(IEnumerable<string> rulePackIds)
    {
        EffectivePolicyPackSet effective = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        foreach (string rulePackId in rulePackIds)
        {
            effective.Packs.Add(
                new ResolvedPolicyPack
                {
                    ContentJson = $@"{{""metadata"":{{""rulePackId"":""{rulePackId}""}}}}",
                });
        }

        return effective;
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

    private static RetrievalQuery ScopedQuery(string queryText, int topK)
    {
        return new RetrievalQuery
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            QueryText = queryText,
            TopK = topK
        };
    }

    private static RetrievalChunk Chunk(string chunkId, float[] embedding, string text)
    {
        return new RetrievalChunk
        {
            ChunkId = chunkId,
            DocumentId = "doc-1",
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SourceType = "Test",
            SourceId = chunkId,
            Title = chunkId,
            Text = text,
            ChunkOrdinal = 0,
            Embedding = embedding,
            EmbeddingModelId = "test-model",
            EmbeddingDimension = embedding.Length
        };
    }
}
