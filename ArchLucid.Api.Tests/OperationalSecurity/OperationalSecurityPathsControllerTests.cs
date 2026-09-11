using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.OperationalSecurity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalSecurityPathsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetPathDetail_returns_not_found_when_service_returns_null()
    {
        Guid pathId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<ISecurityEvidencePathInspectorQueryService> queryService = new();
        queryService
            .Setup(service => service.TryGetPathDetailAsync(Scope, pathId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SecurityEvidencePathDetailResponse?)null);

        Mock<ISecurityEvidencePathRankQueryService> rankQueryService = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        OperationalSecurityPathsController controller = new(
            queryService.Object,
            rankQueryService.Object,
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetPathDetail(pathId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListPaths_passes_filters_to_query_service()
    {
        Guid snapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid cloudResourceId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<ISecurityEvidencePathInspectorQueryService> queryService = new();
        queryService
            .Setup(service => service.ListPathsAsync(
                Scope,
                snapshotId,
                PathKind.Privilege,
                PathConfidenceBand.Confirmed,
                cloudResourceId,
                1,
                50,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResponse<SecurityEvidencePathSummaryResponse>
            {
                Items = [],
                TotalCount = 0,
                Page = 1,
                PageSize = 50,
            });

        Mock<ISecurityEvidencePathRankQueryService> rankQueryService = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        OperationalSecurityPathsController controller = new(
            queryService.Object,
            rankQueryService.Object,
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.ListPaths(
            snapshotId,
            PathKind.Privilege,
            PathConfidenceBand.Confirmed,
            cloudResourceId,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        queryService.Verify(
            service => service.ListPathsAsync(
                Scope,
                snapshotId,
                PathKind.Privilege,
                PathConfidenceBand.Confirmed,
                cloudResourceId,
                1,
                50,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
