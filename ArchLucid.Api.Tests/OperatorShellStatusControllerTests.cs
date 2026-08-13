using ArchLucid.Api.Controllers.Operator;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Operator;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Unit coverage for <c>/v1/operator/shell-status</c> HTTP wiring.</summary>
[Trait("Category", "Unit")]
public sealed class OperatorShellStatusControllerTests
{
    [SkippableFact]
    public async Task GetShellStatusAsync_omits_llm_budget_when_execute_authority_denied()
    {
        OperatorShellStatusResult expected = BuildSampleResult(includeLlmBudget: false);
        Mock<IOperatorShellStatusService> service = new();
        service
            .Setup(shellStatusService => shellStatusService.BuildAsync(
                false,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        OperatorShellStatusController sut = CreateController(
            service.Object,
            includeLlmMonthlyBudgetStatus: false);

        IActionResult result = await sut.GetShellStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        OperatorShellStatusResult body = ok.Value.Should().BeOfType<OperatorShellStatusResult>().Subject;
        body.UsageStatus.Should().NotBeNull();
        body.LlmMonthlyBudgetStatus.Should().BeNull();
        service.Verify(
            shellStatusService => shellStatusService.BuildAsync(false, true, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task GetShellStatusAsync_includes_llm_budget_when_execute_authority_granted()
    {
        OperatorShellStatusResult expected = BuildSampleResult(includeLlmBudget: true);
        Mock<IOperatorShellStatusService> service = new();
        service
            .Setup(shellStatusService => shellStatusService.BuildAsync(
                true,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        OperatorShellStatusController sut = CreateController(
            service.Object,
            includeLlmMonthlyBudgetStatus: true);

        IActionResult result = await sut.GetShellStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        OperatorShellStatusResult body = ok.Value.Should().BeOfType<OperatorShellStatusResult>().Subject;
        body.LlmMonthlyBudgetStatus.Should().NotBeNull();
        body.UsageStatus?.CommercialTier.Should().Be(CommercialPackagingTierLabels.Team);
        service.Verify(
            shellStatusService => shellStatusService.BuildAsync(true, true, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static OperatorShellStatusResult BuildSampleResult(bool includeLlmBudget)
    {
        return new OperatorShellStatusResult
        {
            TrialStatus = new OperatorShellTrialStatusSnapshot { Status = "None" },
            CatalogMigration = new TenantMigrationStatusSnapshot { InMigration = false },
            LlmMonthlyBudgetStatus = includeLlmBudget
                ? new LlmMonthlyTenantDollarBudgetStatusResult { MonthlyBudgetMonitoringActive = false }
                : null,
            AlertsInboxSummary = new AlertsInboxSummaryDto { OpenCount = 2 },
            UsageStatus = new TenantUsageStatusSnapshot(
                false,
                CommercialPackagingTierLabels.Team,
                3,
                CommercialPackagingLimits.TeamSeatsIncluded,
                1,
                CommercialPackagingLimits.TeamWorkspacesIncluded),
        };
    }

    private static OperatorShellStatusController CreateController(
        IOperatorShellStatusService operatorShellStatusService,
        bool includeLlmMonthlyBudgetStatus)
    {
        Mock<IAuthorizationService> authorizationService = new();
        authorizationService
            .Setup(authService => authService.AuthorizeAsync(
                It.IsAny<System.Security.Claims.ClaimsPrincipal>(),
                It.IsAny<object?>(),
                ArchLucidPolicies.ExecuteAuthority))
            .ReturnsAsync(
                includeLlmMonthlyBudgetStatus
                    ? AuthorizationResult.Success()
                    : AuthorizationResult.Failed());

        return new OperatorShellStatusController(operatorShellStatusService, authorizationService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
