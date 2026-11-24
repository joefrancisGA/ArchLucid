using ArchLucid.Api.Controllers.Mcp;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Pagination;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
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

    [Theory]
    [InlineData("policy")]
    [InlineData("prior")]
    [InlineData("price")]
    public async Task Missing_authenticated_actor_denies_all_tools_before_search(string route)
    {
        Mock<IRetrievalQueryService> query = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        Mock<IAskEvidenceAccess> access = new(MockBehavior.Strict);
        access.Setup(a => a.GetAuthorizedActorId()).Returns((string?)null);
        McpRetrievalToolsController controller = CreateController(query.Object, access.Object, runs.Object);
        McpRetrievalSearchBody body = new() { QueryText = "test" };

        IActionResult result = route switch
        {
            "policy" => await controller.PolicyPackSearchAsync(body, CancellationToken.None),
            "prior" => await controller.PriorDecisionSearchAsync(body, CancellationToken.None),
            _ => await controller.PriceRowLookupAsync(body, CancellationToken.None),
        };

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        query.VerifyNoOtherCalls();
        runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Prior_decision_search_uses_only_currently_authorized_runs()
    {
        Guid allowed = Guid.NewGuid();
        Guid denied = Guid.NewGuid();
        Mock<IAskEvidenceAccess> access = new(MockBehavior.Strict);
        access.Setup(a => a.GetAuthorizedActorId()).Returns("reader");
        access.Setup(a => a.CanReadRunAsync(Scope, allowed, CancellationToken.None)).ReturnsAsync(true);
        access.Setup(a => a.CanReadRunAsync(Scope, denied, CancellationToken.None)).ReturnsAsync(false);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake,
            CancellationToken.None)).ReturnsAsync(new RunListPage(
                [new RunRecord { RunId = allowed }, new RunRecord { RunId = denied }], false));

        Mock<IRetrievalQueryService> query = new(MockBehavior.Strict);
        query.Setup(q => q.SearchAsync(It.Is<RetrievalQuery>(r => r.TenantId == Scope.TenantId &&
            r.WorkspaceId == Scope.WorkspaceId && r.ProjectId == Scope.ProjectId &&
            r.CorpusKindFilter == CorpusKind.PriorManifest && !r.IncludePlatformCorpora &&
            r.AuthorizedEvidenceRunIds != null &&
            r.AuthorizedEvidenceRunIds.SetEquals(new[] { allowed })), CancellationToken.None))
            .ReturnsAsync(Array.Empty<RetrievalHit>());
        McpRetrievalToolsController controller = CreateController(query.Object, access.Object, runs.Object);

        IActionResult result = await controller.PriorDecisionSearchAsync(
            new McpRetrievalSearchBody { QueryText = "prior" }, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        access.Verify(a => a.CanReadRunAsync(Scope, allowed, CancellationToken.None), Times.Once);
        access.Verify(a => a.CanReadRunAsync(Scope, denied, CancellationToken.None), Times.Once);
        query.Verify(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), CancellationToken.None), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task No_visible_or_incomplete_run_set_never_dispatches_search(bool incomplete)
    {
        Mock<IRetrievalQueryService> query = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake,
            CancellationToken.None)).ReturnsAsync(new RunListPage([], incomplete));
        McpRetrievalToolsController controller = CreateController(query.Object, runs: runs.Object);

        IActionResult result = await controller.PriorDecisionSearchAsync(
            new McpRetrievalSearchBody { QueryText = "prior" }, CancellationToken.None);

        if (incomplete)
            result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        else
            result.Should().BeOfType<OkObjectResult>().Which.Value
                .Should().BeAssignableTo<IReadOnlyList<RetrievalMcpToolHit>>().Which.Should().BeEmpty();
        query.VerifyNoOtherCalls();
    }

    private static McpRetrievalToolsController CreateController(IRetrievalQueryService queryService,
        IAskEvidenceAccess? access = null, IRunRepository? runs = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IAskEvidenceAccess> defaultAccess = new(MockBehavior.Strict);
        defaultAccess.Setup(a => a.GetAuthorizedActorId()).Returns("reader");

        RetrievalTools tools = new(queryService);

        return new McpRetrievalToolsController(tools, scopeProvider.Object, access ?? defaultAccess.Object,
            runs ?? new Mock<IRunRepository>(MockBehavior.Strict).Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
