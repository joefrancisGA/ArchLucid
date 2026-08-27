using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
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
    public async Task GetApprovalRequests_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(runId.ToString("D"), CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
    }

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
    public async Task GetApprovalRequestLineage_returns_not_found_when_tenant_missing()
    {
        const string approvalRequestId = "apr-lineage-tenant-missing";

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceLineageService> lineage = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            lineageService: lineage.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestLineage(approvalRequestId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
        lineage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequestRationale_returns_not_found_when_tenant_missing()
    {
        const string approvalRequestId = "apr-rationale-tenant-missing";

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceRationaleService> rationale = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            rationaleService: rationale.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestRationale(approvalRequestId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
        rationale.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequestLineage_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string runId = foreignRunId.ToString("N");
        const string approvalRequestId = "apr-lineage-scope";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId, RunId = runId });

        Mock<IGovernanceLineageService> lineage = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            lineageService: lineage.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestLineage(approvalRequestId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        lineage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequestRationale_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        string runId = foreignRunId.ToString("N");
        const string approvalRequestId = "apr-rationale-scope";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId, RunId = runId });

        Mock<IGovernanceRationaleService> rationale = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            rationaleService: rationale.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestRationale(approvalRequestId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        rationale.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_not_found_when_tenant_missing()
    {
        const string approvalRequestId = "apr-approve-tenant-missing";

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            approvalRequestId,
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Reject_returns_not_found_when_tenant_missing()
    {
        const string approvalRequestId = "apr-reject-tenant-missing";

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Reject(
            approvalRequestId,
            new RejectGovernanceRequest { ReviewComment = "no" },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_not_found_when_approval_run_is_out_of_scope()
    {
        const string approvalRequestId = "apr-approve-stale-run";
        Guid foreignRunId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string runId = foreignRunId.ToString("D");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            approvalRequestId,
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_not_found_when_approval_request_is_out_of_scope()
    {
        const string approvalRequestId = "apr-approve-scope";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            approvalRequestId,
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_not_found_when_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = ["apr-batch-tenant-missing"],
                Decision = "approve",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_bad_request_when_all_ids_are_whitespace()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = ["", "  "],
                Decision = "approve",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-scope-test";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = runId,
                ManifestVersion = "1",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_not_found_when_approval_request_is_out_of_scope()
    {
        const string approvalRequestId = "apr-promote-scope";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "test",
                TargetEnvironment = "prod",
                ApprovalRequestId = approvalRequestId,
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Mock<IGovernanceWorkflowService> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowService: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-tenant-missing";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(runId.ToString("D"), CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations(runId.ToString("D"), CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        activations.VerifyNoOtherCalls();
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

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernanceController CreateController(
        IRunRepository? runRepository = null,
        IGovernanceApprovalRequestRepository? approvalRepository = null,
        IGovernancePromotionRecordRepository? promotionRepository = null,
        IGovernanceEnvironmentActivationRepository? activationRepository = null,
        IGovernanceLineageService? lineageService = null,
        IGovernanceRationaleService? rationaleService = null,
        IGovernanceWorkflowService? workflowService = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.NewGuid() });

        return new GovernanceController(
            workflowService ?? Mock.Of<IGovernanceWorkflowService>(),
            approvalRepository ?? Mock.Of<IGovernanceApprovalRequestRepository>(),
            promotionRepository ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepository ?? Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            runRepository ?? runs.Object,
            Mock.Of<IGovernanceDashboardService>(),
            lineageService ?? Mock.Of<IGovernanceLineageService>(),
            rationaleService ?? Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenantRepository ?? Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })),
            NullLogger<GovernanceController>.Instance);
    }
}
