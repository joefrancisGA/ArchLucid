using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceCoverageControllerScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static ITenantRepository TenantExistsRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" }));

    [Fact]
    public async Task PreviewCoverage_returns_not_found_when_tenant_missing()
    {
        Mock<ICoveragePreviewService> preview = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernanceCoverageController controller = new(
            Mock.Of<ICoverageQueryService>(),
            preview.Object,
            Mock.Of<IPolicyPackRepository>(),
            scopeProvider.Object,
            tenants.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        CoveragePreviewRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            FocusedPilotModeEnabled = true,
        };

        IActionResult action = await controller.PreviewCoverage(request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetScopeCoverage_returns_not_found_when_tenant_missing()
    {
        Mock<ICoverageQueryService> coverage = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernanceCoverageController controller = new(
            coverage.Object,
            Mock.Of<ICoveragePreviewService>(),
            Mock.Of<IPolicyPackRepository>(),
            scopeProvider.Object,
            tenants.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await controller.GetScopeCoverage(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        coverage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetScopeCoverage_excludes_pack_metadata_when_pack_is_out_of_scope()
    {
        Guid inScopePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        CoverageSummary summary = new()
        {
            Assignments =
            [
                new CoverageAssignment
                {
                    PolicyPackId = inScopePackId,
                    PolicyPackVersion = "1.0.0",
                },
                new CoverageAssignment
                {
                    PolicyPackId = foreignPackId,
                    PolicyPackVersion = "1.0.0",
                },
            ],
        };

        Mock<ICoverageQueryService> coverage = new();
        coverage
            .Setup(s => s.GetByScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(ids => ids.Contains(foreignPackId) && ids.Contains(inScopePackId)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = inScopePackId,
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    Name = "in-scope-pack",
                    QualityDimension = QualityDimension.Security,
                },
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Scope.TenantId,
                    WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    Name = "foreign-pack-secret",
                    QualityDimension = QualityDimension.CostEffectiveness,
                },
            ]);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        GovernanceCoverageController controller = new(
            coverage.Object,
            Mock.Of<ICoveragePreviewService>(),
            packs.Object,
            scopeProvider.Object,
            TenantExistsRepository());

        IActionResult action = await controller.GetScopeCoverage(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        CoverageSummaryResponse body = ok.Value.Should().BeOfType<CoverageSummaryResponse>().Subject;
        body.Assignments.Should().HaveCount(2);

        CoverageAssignmentResponse inScopeAssignment = body.Assignments!
            .Single(assignment => assignment.PolicyPackId == inScopePackId.ToString("D"));
        inScopeAssignment.QualityDimension.Should().Be(QualityDimension.Security);

        CoverageAssignmentResponse foreignAssignment = body.Assignments
            .Single(assignment => assignment.PolicyPackId == foreignPackId.ToString("D"));
        foreignAssignment.QualityDimension.Should().BeNull();
    }
}
