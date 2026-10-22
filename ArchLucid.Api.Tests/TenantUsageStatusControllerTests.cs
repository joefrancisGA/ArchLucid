using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantUsageStatusControllerTests
{
    [SkippableFact]
    public async Task GetUsageStatusAsync_returns_not_found_when_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
        };
        Mock<ITenantUsageStatusService> service = new();
        service.Setup(s => s.BuildAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantUsageStatusSnapshot?)null);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        TenantUsageStatusController sut = new(service.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await sut.GetUsageStatusAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [SkippableFact]
    public async Task GetUsageStatusAsync_returns_team_payload()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };
        TenantUsageStatusSnapshot snapshot = new(
            false,
            CommercialPackagingTierLabels.Team,
            4,
            CommercialPackagingLimits.TeamSeatsIncluded,
            1,
            CommercialPackagingLimits.TeamWorkspacesIncluded);
        Mock<ITenantUsageStatusService> service = new();
        service.Setup(s => s.BuildAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        TenantUsageStatusController sut = new(service.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await sut.GetUsageStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantUsageStatusResponse body = ok.Value.Should().BeOfType<TenantUsageStatusResponse>().Subject;
        body.IsTrial.Should().BeFalse();
        body.CommercialTier.Should().Be("Team");
        body.SeatsUsed.Should().Be(4);
        body.WorkspacesUsed.Should().Be(1);
    }
}
