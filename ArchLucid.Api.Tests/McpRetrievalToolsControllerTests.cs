using ArchLucid.Api.Controllers.Mcp;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Mcp.Tools;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class McpRetrievalToolsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task PolicyPackSearchAsync_returns_bad_request_when_query_missing()
    {
        McpRetrievalToolsController controller = CreateController(Mock.Of<IRetrievalQueryService>());

        IActionResult action = await controller.PolicyPackSearchAsync(null!, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PolicyPackSearchAsync_returns_hits_from_retrieval_service()
    {
        Mock<IRetrievalQueryService> query = new();

        query
            .Setup(q => q.SearchAsync(
                It.Is<RetrievalQuery>(r => r.QueryText == "network baseline"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "chunk-1",
                    DocumentId = "doc-1",
                    Title = "Baseline pack",
                    Text = "network",
                    Score = 0.9,
                    CorpusKind = CorpusKind.PolicyPack.ToString(),
                    SourceType = "Manifest",
                    SourceId = "src-1"
                }
            ]);

        McpRetrievalToolsController controller = CreateController(query.Object);

        McpRetrievalSearchBody body = new() { QueryText = "network baseline", TopK = 5 };

        IActionResult action = await controller.PolicyPackSearchAsync(body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<RetrievalMcpToolHit> payload =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<RetrievalMcpToolHit>>().Subject;

        payload.Should().ContainSingle();
        payload[0].Title.Should().Be("Baseline pack");
    }

    private static McpRetrievalToolsController CreateController(IRetrievalQueryService queryService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        RetrievalTools tools = new(queryService);

        return new McpRetrievalToolsController(tools, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
