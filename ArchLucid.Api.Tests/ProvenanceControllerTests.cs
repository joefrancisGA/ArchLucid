using System.Security.Claims;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Support;
using ArchLucid.Api.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
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

        ProvenanceController controller = new(
            service.Object,
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            AllowedShareGate())
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

        ProvenanceController controller = new(
            service.Object,
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            AllowedShareGate())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

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

        ProvenanceController controller = new(
            service.Object,
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            AllowedShareGate())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        await controller.GetNodeNeighborhood(runId, nodeId, depth: 999, CancellationToken.None);

        capturedDepth.Should().Be(ProvenanceQueryLimits.MaxNeighborhoodDepthProvenanceRoute);
    }

    [Theory]
    [InlineData("graph")]
    [InlineData("decision")]
    [InlineData("neighborhood")]
    public async Task Restricted_run_sharing_denies_provenance_before_authority_or_graph_reads(string endpoint)
    {
        Guid runId = Guid.Parse("12345678-aaaa-bbbb-cccc-123456789abc");
        Guid nodeId = Guid.NewGuid();

        Mock<IProvenanceQueryService> provenance = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                Scope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        ProvenanceController controller = new(
            provenance.Object, scopes.Object, authority.Object,
            Mock.Of<IManifestHashService>(), sharing.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = endpoint switch
        {
            "graph" => await controller.GetFullGraph(runId, CancellationToken.None),
            "decision" => await controller.GetDecisionGraph(
                runId, "decision-1", CancellationToken.None),
            "neighborhood" => await controller.GetNodeNeighborhood(
                runId, nodeId, 1, CancellationToken.None),
            _ => throw new InvalidOperationException(endpoint),
        };

        result.Should().BeOfType<NotFoundResult>();
        sharing.Verify(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, runId, It.IsAny<CancellationToken>()), Times.Once);
        authority.VerifyNoOtherCalls();
        provenance.VerifyNoOtherCalls();
    }

    private static IArchitectureShareAccessGate AllowedShareGate()
    {
        Mock<IArchitectureShareAccessGate> sharing = new();
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);
        return sharing.Object;
    }

}
