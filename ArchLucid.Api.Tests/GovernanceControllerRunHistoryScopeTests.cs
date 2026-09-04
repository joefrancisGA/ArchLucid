using System.Text.Json;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using ApiGovernanceBatchReviewItemResult = ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewItemResult;
using ApiGovernanceBatchReviewResponse = ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewResponse;

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
    public async Task GetApprovalRequests_returns_items_when_route_run_id_is_padded()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedRunId = $"  {runId:D}  ";
        GovernanceApprovalRequest approval = new()
        {
            RunId = runId.ToString("D"),
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        approvals
            .Setup(a => a.GetByRunIdAsync(runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([approval]);

        GovernanceController sut = CreateController(runRepository: runs.Object, approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(paddedRunId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<GovernanceApprovalRequest> items =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<GovernanceApprovalRequest>>().Subject;
        items.Should().ContainSingle().Which.Should().BeEquivalentTo(approval);
        approvals.VerifyAll();
    }

    [Fact]
    public async Task GetPromotions_returns_items_when_route_run_id_is_padded()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedRunId = $"  {runId:D}  ";
        GovernancePromotionRecord promotion = new()
        {
            RunId = runId.ToString("D"),
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);
        promotions
            .Setup(p => p.GetByRunIdAsync(runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([promotion]);

        GovernanceController sut = CreateController(runRepository: runs.Object, promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(paddedRunId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<GovernancePromotionRecord> items =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<GovernancePromotionRecord>>().Subject;
        items.Should().ContainSingle().Which.Should().BeEquivalentTo(promotion);
        promotions.VerifyAll();
    }

    [Fact]
    public async Task GetActivations_returns_items_when_route_run_id_is_padded()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string paddedRunId = $"  {runId:D}  ";
        GovernanceEnvironmentActivation activation = new()
        {
            RunId = runId.ToString("D"),
            ManifestVersion = "1",
            Environment = "test",
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);
        activations
            .Setup(a => a.GetByRunIdAsync(runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync([activation]);

        GovernanceController sut = CreateController(runRepository: runs.Object, activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations(paddedRunId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<GovernanceEnvironmentActivation> items =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<GovernanceEnvironmentActivation>>().Subject;
        items.Should().ContainSingle().Which.Should().BeEquivalentTo(activation);
        activations.VerifyAll();
    }

    [Fact]
    public async Task GetApprovalRequestLineage_returns_bad_request_when_approval_request_id_is_whitespace()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceLineageService> lineage = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            lineageService: lineage.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestLineage("   ", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        lineage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequestLineage_returns_bad_request_when_approval_request_id_is_whitespace_and_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceLineageService> lineage = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            lineageService: lineage.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestLineage("   ", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        lineage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequestRationale_returns_bad_request_when_approval_request_id_is_whitespace_and_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceRationaleService> rationale = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            rationaleService: rationale.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequestRationale("   ", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        rationale.VerifyNoOtherCalls();
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
    public async Task Approve_returns_bad_request_when_approval_request_id_is_whitespace()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            "   ",
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_bad_request_when_approval_request_id_exceeds_max_length()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        string overlongApprovalRequestId = new string('a', GovernanceRequestValidationRules.ApprovalRequestIdMaxLength + 1);

        IActionResult result = await sut.Approve(
            overlongApprovalRequestId,
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_bad_request_when_review_comment_exceeds_max_length()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            "apr-1",
            new ApproveGovernanceRequest
            {
                ReviewComment = new string('c', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_bad_request_when_review_comment_is_whitespace_only()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            "apr-1",
            new ApproveGovernanceRequest
            {
                ReviewComment = "   ",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Reject_returns_bad_request_when_review_comment_exceeds_max_length()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Reject(
            "apr-1",
            new RejectGovernanceRequest
            {
                ReviewComment = new string('c', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Reject_returns_bad_request_when_approval_request_id_is_whitespace()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Reject(
            "   ",
            new RejectGovernanceRequest { ReviewComment = "no" },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Approve_returns_not_found_when_tenant_missing()
    {
        const string approvalRequestId = "apr-approve-tenant-missing";

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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
    public async Task Approve_returns_validation_failed_when_workflow_reports_invalid_operation()
    {
        const string approvalRequestId = "apr-invalid-op";
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException($"Approval request '{approvalRequestId}' was not found."));

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("reviewer");
        actor.Setup(a => a.GetActorId()).Returns("reviewer-id");

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            approvalRequestId,
            new ApproveGovernanceRequest(),
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task Reject_returns_validation_failed_when_workflow_reports_invalid_operation()
    {
        const string approvalRequestId = "apr-invalid-op";
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.RejectAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException($"Approval request '{approvalRequestId}' was not found."));

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("reviewer");
        actor.Setup(a => a.GetActorId()).Returns("reviewer-id");

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Reject(
            approvalRequestId,
            new RejectGovernanceRequest(),
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task Approve_returns_ok_when_approval_request_id_is_padded()
    {
        const string approvalRequestId = "apr-padded-id";
        string paddedApprovalRequestId = $"  {approvalRequestId}  ";
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("reviewer");
        actor.Setup(a => a.GetActorId()).Returns("reviewer-id");

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Approve(
            paddedApprovalRequestId,
            new ApproveGovernanceRequest { ReviewComment = "ok" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        approvals.VerifyAll();
        workflow.VerifyAll();
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
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
    public async Task SubmitApprovalRequest_returns_validation_failed_when_source_equals_target()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "dev",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_validation_failed_when_source_equals_target_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "dev",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_approval_request_id_is_duplicated()
    {
        const string approvalRequestId = "apr-batch-duplicate";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId });

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId, approvalRequestId],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        body.Results.Should().HaveCount(2);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == approvalRequestId && item.Succeeded);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == approvalRequestId
            && !item.Succeeded
            && item.ErrorCode == ProblemTypes.ValidationFailed
            && item.Message == "duplicate approvalRequestId in batch.");

        workflow.Verify(
            w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_case_variant_approval_request_id_is_duplicated()
    {
        const string approvalRequestId = "APR-BATCH-CASE-VARIANT";
        const string caseVariantApprovalRequestId = "apr-batch-case-variant";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });
        approvals
            .Setup(r => r.GetByIdAsync(caseVariantApprovalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = caseVariantApprovalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId });

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId, caseVariantApprovalRequestId],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        body.Results.Should().HaveCount(2);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == approvalRequestId && item.Succeeded);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == caseVariantApprovalRequestId
            && !item.Succeeded
            && item.ErrorCode == ProblemTypes.ValidationFailed
            && item.Message == "duplicate approvalRequestId in batch.");

        workflow.Verify(
            w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_mixed_list_contains_whitespace_id()
    {
        const string approvalRequestId = "apr-batch-mixed-whitespace";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId });

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId, "   "],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        body.Results.Should().HaveCount(2);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == approvalRequestId && item.Succeeded);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == "   "
            && !item.Succeeded
            && item.ErrorCode == ProblemTypes.ValidationFailed);
        workflow.VerifyAll();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_uppercase_case_variant_of_already_seen_id_is_duplicated()
    {
        const string approvalRequestId = "apr-batch-case-dup";
        const string caseVariantApprovalRequestId = "APR-BATCH-CASE-DUP";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest { ApprovalRequestId = approvalRequestId });

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId, caseVariantApprovalRequestId],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        body.Results.Should().HaveCount(2);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == approvalRequestId && item.Succeeded);
        body.Results.Should().Contain(item =>
            item.ApprovalRequestId == caseVariantApprovalRequestId
            && !item.Succeeded
            && item.ErrorCode == ProblemTypes.ValidationFailed
            && item.Message == "duplicate approvalRequestId in batch.");
        workflow.Verify(
            w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_bad_request_when_decision_is_null()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        GovernanceApprovalBatchReviewRequest request = new()
        {
            ApprovalRequestIds = ["apr-batch-null-decision"],
            Decision = null!,
        };

        IActionResult result = await sut.BatchReviewApprovalRequests(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_bad_request_when_approval_request_ids_is_null()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        GovernanceApprovalBatchReviewRequest request = new()
        {
            ApprovalRequestIds = null!,
            Decision = "approve",
        };

        IActionResult result = await sut.BatchReviewApprovalRequests(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_workflow_reports_invalid_operation()
    {
        const string approvalRequestId = "apr-batch-invalid-op";
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId.ToString("D"),
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ApproveAsync(
                approvalRequestId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException($"Approval request '{approvalRequestId}' was not found."));

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("reviewer");
        actor.Setup(a => a.GetActorId()).Returns("reviewer-id");

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        ApiGovernanceBatchReviewItemResult item = body.Results.Should().ContainSingle().Subject;
        item.Succeeded.Should().BeFalse();
        item.ErrorCode.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_validation_failed_per_item_when_approval_run_id_is_malformed()
    {
        const string approvalRequestId = "apr-batch-malformed-run";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = "not-a-guid",
            });

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = [approvalRequestId],
                Decision = "approve",
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApiGovernanceBatchReviewResponse body =
            ok.Value.Should().BeOfType<ApiGovernanceBatchReviewResponse>().Subject;
        ApiGovernanceBatchReviewItemResult item = body.Results.Should().ContainSingle().Subject;
        item.Succeeded.Should().BeFalse();
        item.ErrorCode.Should().Be(ProblemTypes.ValidationFailed);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_not_found_when_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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
    public async Task BatchReviewApprovalRequests_returns_bad_request_when_decision_is_unrecognized_and_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.BatchReviewApprovalRequests(
            new GovernanceApprovalBatchReviewRequest
            {
                ApprovalRequestIds = ["apr-batch-bad-decision"],
                Decision = "maybe",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BatchReviewApprovalRequests_returns_bad_request_when_all_ids_are_whitespace()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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
    public async Task SubmitApprovalRequest_logs_trimmed_run_id_in_audit_when_run_id_is_padded()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string paddedRunId = $"  {runId:D}  ";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                runId.ToString("D"),
                "1",
                "dev",
                "test",
                "actor",
                "actor-id",
                null,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("actor");
        actor.Setup(a => a.GetActorId()).Returns("actor-id");

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object,
            auditService: audit.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "submit-audit-trim-test";

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = paddedRunId,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: false,
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();
        captured!.RunId.Should().Be(runId);
    }

    [Fact]
    public async Task SubmitApprovalRequest_logs_trimmed_manifest_version_in_audit_when_manifest_version_is_padded()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        const string paddedManifestVersion = "  1  ";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                runId.ToString("D"),
                paddedManifestVersion,
                "dev",
                "test",
                "actor",
                "actor-id",
                null,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("actor");
        actor.Setup(a => a.GetActorId()).Returns("actor-id");

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object,
            actorContext: actor.Object,
            auditService: audit.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "submit-audit-manifest-trim-test";

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = paddedManifestVersion,
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: false,
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();

        using JsonDocument doc = JsonDocument.Parse(captured!.DataJson);
        doc.RootElement.GetProperty("manifestVersion").GetString().Should().Be("1");
    }

    [Fact]
    public async Task SubmitApprovalRequest_accepts_padded_run_id_when_run_is_in_scope()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string paddedRunId = $"  {runId:D}  ";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                runId.ToString("D"),
                "1",
                "dev",
                "test",
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            });

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = paddedRunId,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetApprovalRequests_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequests_returns_bad_request_when_run_id_is_not_valid()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequests_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(overlongRunId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(overlongRunId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations(overlongRunId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        activations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequests_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetApprovalRequests_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            approvalRepository: approvals.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetApprovalRequests("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_bad_request_when_run_id_is_not_valid()
    {
        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetPromotions_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernancePromotionRecordRepository> promotions = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            promotionRepository: promotions.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetPromotions("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        promotions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        activations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_bad_request_when_run_id_is_not_valid()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        activations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        activations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetActivations_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activations = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            activationRepository: activations.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetActivations("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        activations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_validation_failed_when_environment_step_is_invalid()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                runId.ToString("D"),
                "1",
                "dev",
                "prod",
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                true,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "Governance approval requests must follow an allowed environment transition. 'dev' → 'prod' is not permitted."));

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "prod",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_run_id_is_empty()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = string.Empty,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_request_comment_exceeds_max_length()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1.0.0",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
                RequestComment = new string('c', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = overlongRunId,
                ManifestVersion = "1.0.0",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_source_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1.0.0",
                SourceEnvironment = overlongEnvironment,
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        string overlongManifestVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = overlongManifestVersion,
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
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
    public async Task Activate_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-run-id-length";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = overlongRunId,
                ManifestVersion = "1",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_bad_request_when_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-environment-length";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1",
                Environment = overlongEnvironment,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_bad_request_when_environment_is_unrecognized_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-unrecognized-environment";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1",
                Environment = "staging",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        string overlongManifestVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-manifest-version-length";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = overlongManifestVersion,
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_validation_failed_when_workflow_reports_argument_exception()
    {
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.ActivateAsync(
                runId.ToString("D"),
                "  ",
                "test",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("ManifestVersion is required.", nameof(CreateGovernanceActivationRequest.ManifestVersion)));

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-validation-test";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "  ",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
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
    public async Task Promote_returns_validation_failed_when_environment_step_is_invalid()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new();
        workflow
            .Setup(w => w.PromoteAsync(
                runId.ToString("D"),
                "1",
                "dev",
                "prod",
                It.IsAny<string>(),
                null,
                null,
                true,
                false,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "Promotion must follow an allowed environment transition. 'dev' → 'prod' is not permitted."));

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "prod",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_approval_request_id_is_whitespace()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
                ApprovalRequestId = "   ",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_approval_request_id_exceeds_max_length()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        string overlongApprovalRequestId = new string('a', GovernanceRequestValidationRules.ApprovalRequestIdMaxLength + 1);

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
                ApprovalRequestId = overlongApprovalRequestId,
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_notes_exceed_max_length()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
                Notes = new string('n', GovernanceRequestValidationRules.ReviewCommentMaxLength + 1),
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = overlongRunId,
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_target_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = overlongEnvironment,
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111112");
        string overlongManifestVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = overlongManifestVersion,
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            workflowFacade: workflow.Object);
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
    public async Task Promote_returns_not_found_when_approval_run_is_out_of_scope()
    {
        const string approvalRequestId = "apr-promote-stale-run";
        Guid foreignRunId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        Guid inScopeRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        string foreignRunIdText = foreignRunId.ToString("D");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = foreignRunIdText,
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, inScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = inScopeRunId });
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            runRepository: runs.Object,
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = inScopeRunId.ToString("D"),
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
    public async Task Promote_returns_not_found_when_approval_request_is_out_of_scope()
    {
        const string approvalRequestId = "apr-promote-scope";
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            approvalRepository: approvals.Object,
            workflowFacade: workflow.Object);
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

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
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
    public async Task Promote_returns_validation_failed_when_source_equals_target()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "dev",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_validation_failed_when_source_equals_target_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = Guid.NewGuid().ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "dev",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
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
    public async Task SubmitApprovalRequest_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = Guid.Empty.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequest_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = "not-a-guid",
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = Guid.Empty.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Promote_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = "not-a-guid",
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-empty-run-tenant-missing";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = Guid.Empty.ToString("D"),
                ManifestVersion = "1",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        workflow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Activate_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            workflowFacade: workflow.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-invalid-run-tenant-missing";

        IActionResult result = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = "not-a-guid",
                ManifestVersion = "1",
                Environment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    private static GovernanceController CreateController(
        IRunRepository? runRepository = null,
        IGovernanceApprovalRequestRepository? approvalRepository = null,
        IGovernancePromotionRecordRepository? promotionRepository = null,
        IGovernanceEnvironmentActivationRepository? activationRepository = null,
        IGovernanceLineageService? lineageService = null,
        IGovernanceRationaleService? rationaleService = null,
        IGovernanceWorkflowFacade? workflowFacade = null,
        ITenantRepository? tenantRepository = null,
        IActorContext? actorContext = null,
        IAuditService? auditService = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.NewGuid() });

        return GovernanceControllerTestFactory.Create(
            workflowFacade: workflowFacade,
            approvalRepository: approvalRepository,
            promotionRepository: promotionRepository,
            activationRepository: activationRepository,
            actorContext: actorContext,
            scopeContextProvider: scope.Object,
            runRepository: runRepository ?? runs.Object,
            lineageService: lineageService,
            rationaleService: rationaleService,
            auditService: auditService,
            tenantRepository: tenantRepository ?? TenantExistsRepository());
    }
}
