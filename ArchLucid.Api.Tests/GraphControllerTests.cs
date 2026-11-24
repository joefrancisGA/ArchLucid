using System.Security.Claims;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Support;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static GraphController CreateController(
        IAuthorityQueryService? authorityQueryService = null,
        IRunRepository? runRepository = null,
        KnowledgeGraphLimitsOptions? limits = null,
        IArchitectureShareAccessGate? shareGate = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuthorityQueryService> authorityMock = new();
        IAuthorityQueryService authorityService = authorityQueryService ?? authorityMock.Object;

        if (authorityQueryService is null)
        {
            authorityMock
                .Setup(s => s.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((RunDetailDto?)null);
        }

        Mock<IRunRepository> runsMock = new();
        IRunRepository runsService = runRepository ?? runsMock.Object;

        if (runRepository is null)
        {
            runsMock
                .Setup(r => r.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((RunRecord?)null);
        }

        IOptions<KnowledgeGraphLimitsOptions> options = Options.Create(limits ?? new KnowledgeGraphLimitsOptions
        {
            FullGraphResponseMaxNodes = 500
        });

        if (shareGate is null)
        {
            Mock<IArchitectureShareAccessGate> allowed = new(MockBehavior.Strict);
            allowed.Setup(g => g.EnsureRunReadAllowedAsync(It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((IActionResult?)null);
            shareGate = allowed.Object;
        }

        return new GraphController(
            authorityService,
            runsService,
            scopeProvider.Object,
            Mock.Of<IManifestHashService>(),
            options)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = new ServiceCollection()
                        .AddSingleton<IArchitectureShareAccessGate>(shareGate)
                        .BuildServiceProvider()
                }
            }
        };
    }

    private static RunDetailDto RunWithGraph(int nodeCount)
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = RunId,
            CreatedUtc = DateTime.UtcNow,
            Nodes = Enumerable.Range(0, nodeCount)
                .Select(i => new GraphNode
                {
                    NodeId = $"node-{i}",
                    Label = $"node-{i}",
                    NodeType = "service"
                })
                .ToList()
        };

        return new RunDetailDto
        {
            Run = new RunRecord { RunId = RunId, ProjectId = "proj-a" },
            GraphSnapshot = snapshot
        };
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Restricted_run_returns_404_before_graph_detail_read(bool paged)
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        GraphController controller = CreateController(authority.Object, shareGate: sharing.Object);
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        var denial = ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, RunId);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, RunId, ct))
            .ReturnsAsync(denial);

        IActionResult result = paged
            ? await controller.GetArchitectureGraphNodesPage(RunId, ct: ct)
            : await controller.GetArchitectureGraph(RunId, ct);

        result.Should().BeSameAs(denial);
        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        sharing.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, RunId, ct), Times.Once);
        authority.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetArchitectureGraph_returns_not_found_when_run_missing()
    {
        GraphController controller = CreateController();

        IActionResult action = await controller.GetArchitectureGraph(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetArchitectureGraph_returns_not_found_when_graph_snapshot_missing()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = new RunRecord { RunId = RunId } });

        GraphController controller = CreateController(authorityQueryService: authority.Object);

        IActionResult action = await controller.GetArchitectureGraph(RunId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetArchitectureGraph_returns_ok_for_small_graph()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunWithGraph(nodeCount: 2));

        GraphController controller = CreateController(authorityQueryService: authority.Object);

        IActionResult action = await controller.GetArchitectureGraph(RunId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GraphViewModel body = ok.Value.Should().BeOfType<GraphViewModel>().Subject;
        body.Nodes.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetArchitectureGraph_returns_payload_too_large_when_node_count_exceeds_limit()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunWithGraph(nodeCount: 3));

        GraphController controller = CreateController(
            authorityQueryService: authority.Object,
            limits: new KnowledgeGraphLimitsOptions { FullGraphResponseMaxNodes = 2 });

        IActionResult action = await controller.GetArchitectureGraph(RunId, CancellationToken.None);

        ObjectResult tooLarge = action.Should().BeOfType<ObjectResult>().Subject;
        tooLarge.StatusCode.Should().Be(StatusCodes.Status413PayloadTooLarge);
    }

    [Fact]
    public async Task GetArchitectureGraphTemporalSnapshot_returns_bad_request_when_asOf_missing()
    {
        GraphController controller = CreateController();

        IActionResult action = await controller.GetArchitectureGraphTemporalSnapshot(
            runId: RunId,
            asOf: null,
            ct: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetArchitectureGraphNodesPage_returns_paged_nodes()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(s => s.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunWithGraph(nodeCount: 5));

        GraphController controller = CreateController(authorityQueryService: authority.Object);

        IActionResult action = await controller.GetArchitectureGraphNodesPage(
            RunId,
            page: 1,
            pageSize: 2,
            ct: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GraphNodesPageResponse body = ok.Value.Should().BeOfType<GraphNodesPageResponse>().Subject;
        body.Nodes.Should().HaveCount(2);
        body.TotalNodes.Should().Be(5);
        body.HasMore.Should().BeTrue();
    }
}
