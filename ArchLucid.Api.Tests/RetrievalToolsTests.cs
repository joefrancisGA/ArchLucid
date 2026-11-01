using ArchLucid.Core.Retrieval;
using ArchLucid.Mcp.Tools;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalToolsTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task PriceRowLookupAsync_matches_corpus_kind_with_mixed_case_labels()
    {
        Mock<IRetrievalQueryService> queryService = new();
        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "price-chunk-1",
                    DocumentId = "price-doc-1",
                    Title = "D4s v3 East US",
                    Text = "Azure retail price row",
                    Score = 0.9,
                    CorpusKind = "azureretailprice",
                    SourceType = "AzureRetail",
                    SourceId = "price-1"
                }
            ]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "D4s v3",
            TopK = 1
        };

        IReadOnlyList<RetrievalMcpToolHit> hits =
            await sut.PriceRowLookupAsync(request, CancellationToken.None);

        hits.Should().ContainSingle();
    }

    [Fact]
    public async Task PriceRowLookupAsync_returns_retail_hits_when_they_rank_below_requested_topk()
    {
        Mock<IRetrievalQueryService> queryService = new();

        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RetrievalQuery query, CancellationToken _) =>
            {
                List<RetrievalHit> rankedHits =
                [
                    .. Enumerable.Range(0, 12).Select(static i => new RetrievalHit
                    {
                        ChunkId = $"policy-chunk-{i}",
                        DocumentId = $"policy-doc-{i}",
                        Title = $"Policy {i}",
                        Text = "policy baseline",
                        Score = 0.99 - (i * 0.01),
                        CorpusKind = CorpusKind.PolicyPack.ToString(),
                        SourceType = "Manifest",
                        SourceId = $"policy-{i}"
                    }),
                    new RetrievalHit
                    {
                        ChunkId = "price-chunk-1",
                        DocumentId = "price-doc-1",
                        Title = "D4s v3 East US",
                        Text = "Azure retail price row",
                        Score = 0.10,
                        CorpusKind = CorpusKind.AzureRetailPrice.ToString(),
                        SourceType = "AzureRetail",
                        SourceId = "price-1"
                    }
                ];

                return rankedHits.Take(query.TopK).ToList();
            });

        RetrievalTools sut = new(queryService.Object);

        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            QueryText = "D4s v3",
            TopK = 3
        };

        IReadOnlyList<RetrievalMcpToolHit> hits =
            await sut.PriceRowLookupAsync(request, CancellationToken.None);

        hits.Should().ContainSingle();
        hits[0].CorpusKind.Should().Be(CorpusKind.AzureRetailPrice.ToString());
        hits[0].Title.Should().Be("D4s v3 East US");
    }

    [Fact]
    public async Task PolicyPackSearchAsync_returns_empty_snippet_when_hit_text_is_null()
    {
        Mock<IRetrievalQueryService> queryService = new();
        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "chunk-1",
                    DocumentId = "doc-1",
                    Title = "Policy baseline",
                    Text = null!,
                    Score = 0.9,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "policy-1"
                }
            ]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "network baseline"
        };

        IReadOnlyList<RetrievalMcpToolHit> hits =
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        hits.Should().ContainSingle().Subject.Snippet.Should().BeEmpty();
    }

    [Fact]
    public async Task PolicyPackSearchAsync_returns_only_requested_topk_after_corpus_filter()
    {
        Mock<IRetrievalQueryService> queryService = new();
        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "policy-1",
                    DocumentId = "policy-doc-1",
                    Title = "Policy 1",
                    Text = "policy baseline",
                    Score = 0.99,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "p1"
                },
                new RetrievalHit
                {
                    ChunkId = "policy-2",
                    DocumentId = "policy-doc-2",
                    Title = "Policy 2",
                    Text = "policy baseline",
                    Score = 0.98,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "p2"
                },
                new RetrievalHit
                {
                    ChunkId = "policy-3",
                    DocumentId = "policy-doc-3",
                    Title = "Policy 3",
                    Text = "policy baseline",
                    Score = 0.97,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "p3"
                },
                new RetrievalHit
                {
                    ChunkId = "policy-4",
                    DocumentId = "policy-doc-4",
                    Title = "Policy 4",
                    Text = "policy baseline",
                    Score = 0.96,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "p4"
                },
            ]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "baseline",
            TopK = 3,
        };

        IReadOnlyList<RetrievalMcpToolHit> hits =
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        hits.Should().HaveCount(3);
        hits.Select(h => h.DocumentId).Should().Equal("policy-doc-1", "policy-doc-2", "policy-doc-3");
    }

    [Fact]
    public async Task PolicyPackSearchAsync_returns_empty_title_when_hit_title_is_null()
    {
        Mock<IRetrievalQueryService> queryService = new();
        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "chunk-1",
                    DocumentId = "doc-1",
                    Title = null!,
                    Text = "policy baseline",
                    Score = 0.9,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "policy-1"
                }
            ]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "network baseline"
        };

        IReadOnlyList<RetrievalMcpToolHit> hits =
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        hits.Should().ContainSingle().Subject.Title.Should().BeEmpty();
    }

    [Fact]
    public async Task PolicyPackSearchAsync_throws_when_tenant_id_missing()
    {
        RetrievalTools sut = new(Mock.Of<IRetrievalQueryService>());

        RetrievalMcpToolRequest request = new()
        {
            TenantId = Guid.Empty,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "network baseline"
        };

        Func<Task> act = async () =>
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName("request");
    }

    [Fact]
    public async Task PolicyPackSearchAsync_throws_when_query_text_is_null()
    {
        Mock<IRetrievalQueryService> queryService = new(MockBehavior.Strict);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = null!,
        };

        Func<Task> act = async () =>
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        (await act.Should().ThrowAsync<ArgumentException>())
            .Which.ParamName.Should().Be(nameof(RetrievalMcpToolRequest.QueryText));
    }

    [Fact]
    public async Task PolicyPackSearchAsync_clamps_topk_below_one_when_calling_retrieval_service()
    {
        Mock<IRetrievalQueryService> queryService = new();
        int? observedTopK = null;

        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .Callback<RetrievalQuery, CancellationToken>((query, _) => observedTopK = query.TopK)
            .ReturnsAsync([]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "baseline",
            TopK = 0,
        };

        await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        observedTopK.Should().Be(25, "corpus-filtered MCP searches prefetch 25 hits before filtering");
    }

    [Fact]
    public async Task PriceRowLookupAsync_clamps_negative_topk_when_calling_retrieval_service()
    {
        Mock<IRetrievalQueryService> queryService = new();
        int? observedTopK = null;

        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .Callback<RetrievalQuery, CancellationToken>((query, _) => observedTopK = query.TopK)
            .ReturnsAsync([]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "D4s v3",
            TopK = -3,
        };

        await sut.PriceRowLookupAsync(request, CancellationToken.None);

        observedTopK.Should().Be(25);
    }

    [Fact]
    public async Task PriorDecisionSearchAsync_clamps_topk_above_twenty_five_when_calling_retrieval_service()
    {
        Mock<IRetrievalQueryService> queryService = new();
        int? observedTopK = null;

        queryService
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .Callback<RetrievalQuery, CancellationToken>((query, _) => observedTopK = query.TopK)
            .ReturnsAsync([]);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "prior decision",
            TopK = 100,
        };

        await sut.PriorDecisionSearchAsync(request, CancellationToken.None);

        observedTopK.Should().Be(25, "corpus-filtered MCP searches prefetch 25 hits before filtering");
    }

    [Fact]
    public async Task PolicyPackSearchAsync_throws_when_query_text_is_whitespace_only()
    {
        Mock<IRetrievalQueryService> queryService = new(MockBehavior.Strict);

        RetrievalTools sut = new(queryService.Object);
        RetrievalMcpToolRequest request = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            QueryText = "   ",
        };

        Func<Task> act = async () =>
            await sut.PolicyPackSearchAsync(request, CancellationToken.None);

        (await act.Should().ThrowAsync<ArgumentException>())
            .Which.ParamName.Should().Be(nameof(RetrievalMcpToolRequest.QueryText));
    }
}
