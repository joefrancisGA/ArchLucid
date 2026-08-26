using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernancePostureControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetPosture_returns_summary_for_current_scope()
    {
        ArchitecturePostureSummary expected = new()
        {
            PrimaryPillarKey = nameof(ArchitecturePillar.Security),
        };

        Mock<IArchitecturePostureService> postureService = new();
        postureService
            .Setup(service => service.GetSummaryAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        GovernancePostureController controller = new(
            postureService.Object,
            scopeProvider.Object,
            Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })));

        IActionResult result = await controller.GetPosture(projectId: null, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetPosture_returns_empty_summary_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitecturePostureService> postureService = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        GovernancePostureController controller = new(
            postureService.Object,
            scopeProvider.Object,
            Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })));

        IActionResult result = await controller.GetPosture(foreignProjectId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<ArchitecturePostureSummary>();
        postureService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPosture_returns_not_found_when_tenant_missing()
    {
        Mock<IArchitecturePostureService> postureService = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernancePostureController controller = new(postureService.Object, scopeProvider.Object, tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetPosture(projectId: null, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        postureService.VerifyNoOtherCalls();
    }
}
