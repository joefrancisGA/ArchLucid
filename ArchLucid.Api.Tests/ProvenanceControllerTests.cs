using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProvenanceControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetFullGraph_returns_not_found_when_service_returns_null()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IProvenanceQueryService> service = new();
        service
            .Setup(s => s.GetFullGraphAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GraphViewModel?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ProvenanceController controller = new(service.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.GetFullGraph(runId, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetFullGraph_returns_ok_when_service_returns_graph()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        GraphViewModel graph = new();

        Mock<IProvenanceQueryService> service = new();
        service
            .Setup(s => s.GetFullGraphAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(graph);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ProvenanceController controller = new(service.Object, scopeProvider.Object);

        IActionResult action = await controller.GetFullGraph(runId, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(graph);
    }

    [Fact]
    public async Task GetNodeNeighborhood_clamps_depth_before_calling_service()
    {
        Guid runId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Guid nodeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        int capturedDepth = 0;

        Mock<IProvenanceQueryService> service = new();
        service
            .Setup(s => s.GetNodeNeighborhoodAsync(
                Scope,
                runId,
                nodeId,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, Guid, Guid, int, CancellationToken>((_, _, _, depth, _) =>
                capturedDepth = depth)
            .ReturnsAsync(new GraphViewModel());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ProvenanceController controller = new(service.Object, scopeProvider.Object);

        await controller.GetNodeNeighborhood(runId, nodeId, depth: 999, CancellationToken.None);

        capturedDepth.Should().Be(ProvenanceQueryLimits.MaxNeighborhoodDepthProvenanceRoute);
    }
}
