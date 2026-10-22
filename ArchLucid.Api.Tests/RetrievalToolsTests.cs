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
}
