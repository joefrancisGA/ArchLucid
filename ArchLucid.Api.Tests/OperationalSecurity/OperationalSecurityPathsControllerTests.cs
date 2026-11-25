using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.ArchitectureIntelligence;
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
            Mock.Of<ISecurityEvidencePathReportQueryService>(),
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            Mock.Of<ISecureNowPilotPathDispositionService>(),
            scopeProvider.Object,
            Mock.Of<IActorContext>())
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
            Mock.Of<ISecurityEvidencePathReportQueryService>(),
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            Mock.Of<ISecureNowPilotPathDispositionService>(),
            scopeProvider.Object,
            Mock.Of<IActorContext>())
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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task GetAttackPathReport_returns_not_found_when_snapshot_missing(bool download)
    {
        Guid snapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<ISecurityEvidencePathReportQueryService> reportQueryService = new();
        reportQueryService
            .Setup(service => service.TryGetReportAsync(Scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SecurityEvidencePathReportResponse?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        OperationalSecurityPathsController controller = new(
            Mock.Of<ISecurityEvidencePathInspectorQueryService>(),
            Mock.Of<ISecurityEvidencePathRankQueryService>(),
            reportQueryService.Object,
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            Mock.Of<ISecureNowPilotPathDispositionService>(),
            scopeProvider.Object,
            Mock.Of<IActorContext>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetAttackPathReport(snapshotId, download, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Attack_path_download_uses_the_same_scoped_report_and_preserves_the_observation()
    {
        Guid snapshotId = Guid.NewGuid(), pathId = Guid.NewGuid(), legacyPathId = Guid.NewGuid();
        DateTime captured = new(2026, 11, 25, 1, 0, 0, DateTimeKind.Utc);
        var observation = new PublicNetworkAccessVerification(
            Guid.NewGuid(), PublicNetworkAccessVerificationOutcome.Contradicted, snapshotId, captured)
        {
            Evidence = new("azure-inventory-public-network-access/1", Scope.TenantId, Scope.WorkspaceId,
                Scope.ProjectId, Guid.NewGuid(), "publicNetworkAccess", 24),
        };
        var probe = new InventoryFalsificationProbe(InventoryFalsificationOutcome.Refuted,
            "The explicit Azure property only.", observation);
        SecurityEvidencePathReportResponse report = new()
        {
            SnapshotId = snapshotId,
            VulnerableAttackPaths =
            [
                new() { PathId = pathId, SnapshotId = snapshotId },
                new() { PathId = legacyPathId, SnapshotId = snapshotId },
            ],
            InventoryVerifications = [new(pathId, Guid.NewGuid(), captured.AddMinutes(1), probe)],
        };

        Mock<ISecurityEvidencePathReportQueryService> query = new(MockBehavior.Strict);
        using CancellationTokenSource cancellation = new();
        query.Setup(r => r.TryGetReportAsync(Scope, snapshotId, cancellation.Token)).ReturnsAsync(report);
        OperationalSecurityPathsController controller = BuildReportController(query.Object);

        IActionResult inline = await controller.GetAttackPathReport(snapshotId, cancellationToken: cancellation.Token);
        inline.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(report);
        controller.Response.Headers.ContentDisposition.ToString().Should().BeEmpty();

        IActionResult download = await controller.GetAttackPathReport(snapshotId, download: true, cancellationToken: cancellation.Token);
        var exported = download.Should().BeOfType<JsonResult>().Which.Value
            .Should().BeOfType<SecurityEvidencePathReportResponse>().Which;
        exported.Should().BeSameAs(report);
        exported.InventoryVerifications.Should().ContainSingle().Which.Verification.Should().Be(probe);
        exported.InventoryVerifications.Should().NotContain(entry => entry.PathId == legacyPathId);
        controller.Response.Headers.ContentDisposition.ToString()
            .Should().Be($"attachment; filename=\"securenow-attack-path-report-{snapshotId:N}.json\"");
        query.Verify(r => r.TryGetReportAsync(Scope, snapshotId, cancellation.Token), Times.Exactly(2));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Attack_path_download_never_attaches_missing_or_mismatched_reports(bool mismatchedSnapshot)
    {
        Guid snapshotId = mismatchedSnapshot ? Guid.NewGuid() : Guid.Empty;
        Mock<ISecurityEvidencePathReportQueryService> query = new(MockBehavior.Strict);
        if (mismatchedSnapshot)
        {
            query.Setup(r => r.TryGetReportAsync(Scope, snapshotId, CancellationToken.None))
                .ReturnsAsync(new SecurityEvidencePathReportResponse { SnapshotId = Guid.NewGuid() });
        }
        OperationalSecurityPathsController controller = BuildReportController(query.Object);

        IActionResult result = await controller.GetAttackPathReport(snapshotId, download: true);
        result.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(mismatchedSnapshot ? StatusCodes.Status404NotFound : StatusCodes.Status400BadRequest);
        controller.Response.Headers.ContentDisposition.ToString().Should().BeEmpty();
        query.Verify(r => r.TryGetReportAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            mismatchedSnapshot ? Times.Once() : Times.Never());
    }

    private static OperationalSecurityPathsController BuildReportController(ISecurityEvidencePathReportQueryService query)
    {
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);
        return new(
            Mock.Of<ISecurityEvidencePathInspectorQueryService>(),
            Mock.Of<ISecurityEvidencePathRankQueryService>(),
            query,
            Mock.Of<ISecurityEvidencePathExplanationService>(),
            Mock.Of<ISecureNowPilotPathDispositionService>(),
            scopes.Object,
            Mock.Of<IActorContext>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

}
