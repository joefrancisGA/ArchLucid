using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceControllerRunHistoryScopeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetApprovalRequests_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(runRepository: runs.Object, approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(runId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(runRepository: runs.Object, promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(runId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        promotions.VerifyNoOtherCalls();
    }

    private static GovernanceController CreateController(
        IRunRepository? runRepository = null,
        IGovernanceApprovalRequestRepository? approvalRepository = null,
        IGovernancePromotionRecordRepository? promotionRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.NewGuid() });

        return new GovernanceController(
            Mock.Of<IGovernanceWorkflowService>(),
            approvalRepository ?? Mock.Of<IGovernanceApprovalRequestRepository>(),
            promotionRepository ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            runRepository ?? runs.Object,
            Mock.Of<IGovernanceDashboardService>(),
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            NullLogger<GovernanceController>.Instance);
    }
}
