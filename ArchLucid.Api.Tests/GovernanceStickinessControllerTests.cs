using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceStickinessControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static GovernanceStickinessController BuildSut(
        Mock<IScopeContextProvider>? scopeProvider = null,
        Mock<IFindingDispositionService>? dispositionService = null,
        Mock<IArchitectureRiskRegisterService>? riskRegister = null,
        Mock<IArchitectureReviewRecurrenceScheduleRepository>? recurrenceRepo = null,
        Mock<IArchitectureReviewRecurrenceNextRunCalculator>? recurrenceCalculator = null)
    {
        Mock<IScopeContextProvider> scope = scopeProvider ?? new Mock<IScopeContextProvider>();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("reviewer@test");

        Mock<IFindingDispositionService> dispositions = dispositionService ?? new Mock<IFindingDispositionService>();
        dispositions
            .Setup(d => d.ListHistoryAsync(Scope.TenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<FindingDispositionEventDto>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.ListActiveAsync(Scope.TenantId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());

        Mock<IArchitectureRiskRegisterService> riskRegisterService = riskRegister ?? new Mock<IArchitectureRiskRegisterService>();

        if (riskRegister is null)
        {
            riskRegisterService
                .Setup(r => r.GetRegisterAsync(
                    Scope.TenantId,
                    Scope.ProjectId,
                    It.IsAny<int>(),
                    It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ArchitectureRiskRegisterResponse());
        }

        Mock<IArchitectureDecisionRegisterService> decisionRegister = new();
        decisionRegister
            .Setup(d => d.GetRegisterAsync(
                Scope.TenantId,
                Scope.ProjectId,
                It.IsAny<int>(),
                It.IsAny<ArchitectureDecisionRegisterQueryOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureDecisionRegisterResponse());

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepository =
            recurrenceRepo ?? new Mock<IArchitectureReviewRecurrenceScheduleRepository>();
        recurrenceRepository
            .Setup(r => r.ListByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureReviewRecurrenceSchedule>());

        Mock<IArchitectureReviewRecurrenceNextRunCalculator> nextRun =
            recurrenceCalculator ?? new Mock<IArchitectureReviewRecurrenceNextRunCalculator>();

        if (recurrenceCalculator is null)
        {
            nextRun
                .Setup(c => c.IsSupportedCronExpression(It.IsAny<string>()))
                .Returns(true);
            nextRun
                .Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>()))
                .Returns(DateTime.UtcNow.AddDays(7));
        }

        Mock<IGovernanceDigestDecisionNeededComposer> digestComposer = new();
        digestComposer
            .Setup(c => c.BuildSummaryAsync(Scope.TenantId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceDecisionsNeededSummaryResponse());

        Mock<IReviewsAwaitingActionQueryService> reviewsAwaiting = new();
        reviewsAwaiting
            .Setup(r => r.ListAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceReviewsAwaitingActionResponse());

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new GovernanceStickinessController(
                scope.Object,
                actor.Object,
                dispositions.Object,
                riskExceptions.Object,
                riskRegisterService.Object,
                decisionRegister.Object,
                recurrenceRepository.Object,
                nextRun.Object,
                digestComposer.Object,
                reviewsAwaiting.Object,
                audit.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    [Fact]
    public async Task GetRiskRegister_returns_service_payload()
    {
        ArchitectureRiskRegisterResponse expected = new();
        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(r => r.GetRegisterAsync(
                Scope.TenantId,
                Scope.ProjectId,
                200,
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        GovernanceStickinessController controller = BuildSut(riskRegister: riskRegister);

        IActionResult action = await controller.GetRiskRegister(projectId: null, maxRows: 200, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task GetRiskRegister_when_assigned_to_me_passes_open_assignee_filter()
    {
        ArchitectureRiskRegisterListOptions? capturedOptions = null;
        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(r => r.GetRegisterAsync(
                Scope.TenantId,
                Scope.ProjectId,
                200,
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid?, int, ArchitectureRiskRegisterListOptions?, CancellationToken>(
                (_, _, _, options, _) => capturedOptions = options)
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActor()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActorId()).Returns("assignee-guid");

        GovernanceStickinessController sut = new(
            scopeProvider.Object,
            actor.Object,
            Mock.Of<IFindingDispositionService>(),
            Mock.Of<IRiskExceptionService>(),
            riskRegister.Object,
            Mock.Of<IArchitectureDecisionRegisterService>(),
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await sut.GetRiskRegister(
            projectId: null,
            maxRows: 200,
            assignedToMe: true,
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        capturedOptions.Should().NotBeNull();
        capturedOptions!.OpenFindingsOnly.Should().BeTrue();
        capturedOptions.AssignedToUserIds.Should().Contain("assignee@example.com");
    }

    [Fact]
    public async Task GetRiskRegister_when_assigned_to_me_and_no_identities_returns_empty_without_service_call()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns((string?)null);
        actor.Setup(context => context.GetActor()).Returns(string.Empty);
        actor.Setup(context => context.GetActorId()).Returns(string.Empty);

        GovernanceStickinessController sut = new(
            scopeProvider.Object,
            actor.Object,
            Mock.Of<IFindingDispositionService>(),
            Mock.Of<IRiskExceptionService>(),
            riskRegister.Object,
            Mock.Of<IArchitectureDecisionRegisterService>(),
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await sut.GetRiskRegister(
            projectId: null,
            maxRows: 200,
            assignedToMe: true,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureRiskRegisterResponse body = ok.Value.Should().BeAssignableTo<ArchitectureRiskRegisterResponse>().Subject;
        body.Entries.Should().BeEmpty();
        riskRegister.Verify(
            service => service.GetRegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<int>(),
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static void SetIdempotencyKey(GovernanceStickinessController controller, string key = "test-idempotency-key")
    {
        controller.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = key;
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_idempotency_key_missing()
    {
        GovernanceStickinessController controller = BuildSut();

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok"
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_idempotency_key_missing()
    {
        GovernanceStickinessController controller = BuildSut();

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_body_null()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        IActionResult action =
            await controller.RecordDisposition("finding-1", null, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_service_throws_argument_exception()
    {
        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("invalid disposition"));

        GovernanceStickinessController controller = BuildSut(dispositionService: dispositions);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok"
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_finding_ids_empty()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_when_source_run_empty()
    {
        GovernanceStickinessController controller = BuildSut();

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = Guid.Empty,
            Name = "weekly review"
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_when_is_enabled_omitted()
    {
        GovernanceStickinessController controller = BuildSut();

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "weekly review",
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_persists_inactive_schedule()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureReviewRecurrenceSchedule? captured = null;

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureReviewRecurrenceSchedule, CancellationToken>((schedule, _) => captured = schedule)
            .Returns(Task.CompletedTask);

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            Name = "paused review",
            CronExpression = "0 9 * * 1",
            IsEnabled = false,
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureReviewRecurrenceSchedule body =
            ok.Value.Should().BeOfType<ArchitectureReviewRecurrenceSchedule>().Subject;
        body.IsEnabled.Should().BeFalse();
        captured.Should().NotBeNull();
        captured!.IsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_persists_schedule_and_audits()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureReviewRecurrenceSchedule? captured = null;

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureReviewRecurrenceSchedule, CancellationToken>((schedule, _) => captured = schedule)
            .Returns(Task.CompletedTask);

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            Name = "  weekly review  ",
            CronExpression = "0 9 * * 1",
            IsEnabled = true
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureReviewRecurrenceSchedule body =
            ok.Value.Should().BeOfType<ArchitectureReviewRecurrenceSchedule>().Subject;
        body.SourceRunId.Should().Be(sourceRunId);
        body.Name.Should().Be("weekly review");
        captured.Should().NotBeNull();
        captured!.TenantId.Should().Be(Scope.TenantId);
    }

    [Fact]
    public async Task UpdateRecurrenceSchedule_returns_not_found_when_schedule_missing()
    {
        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureReviewRecurrenceSchedule?)null);

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo);

        UpdateArchitectureReviewRecurrenceScheduleRequest request = new() { Name = "updated" };

        IActionResult action = await controller.UpdateRecurrenceSchedule(
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            request,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_for_invalid_cron()
    {
        GovernanceStickinessController controller = BuildSut(
            recurrenceCalculator: BuildRealRecurrenceCalculator());

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "bad cron",
            CronExpression = "not-a-real-cron",
            IsEnabled = true,
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public void PreviewRecurrenceScheduleRuns_returns_weekly_monday_runs_for_default_expression()
    {
        GovernanceStickinessController controller = BuildSut(recurrenceCalculator: BuildRealRecurrenceCalculator());
        PreviewRecurrenceScheduleRunsRequest request = new()
        {
            CronExpression = "0 8 * * 1",
            Count = 5,
            FromUtc = new DateTime(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc),
        };

        IActionResult action = controller.PreviewRecurrenceScheduleRuns(request);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        PreviewRecurrenceScheduleRunsResponse body =
            ok.Value.Should().BeOfType<PreviewRecurrenceScheduleRunsResponse>().Subject;
        body.IsValid.Should().BeTrue();
        body.NextRunUtc.Should().HaveCount(5);
        body.NextRunUtc[0].Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void PreviewRecurrenceScheduleRuns_marks_invalid_cron_without_daily_fallback()
    {
        GovernanceStickinessController controller = BuildSut(recurrenceCalculator: BuildRealRecurrenceCalculator());

        IActionResult action = controller.PreviewRecurrenceScheduleRuns(new PreviewRecurrenceScheduleRunsRequest
        {
            CronExpression = "not-a-real-cron",
            Count = 5,
        });

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        PreviewRecurrenceScheduleRunsResponse body =
            ok.Value.Should().BeOfType<PreviewRecurrenceScheduleRunsResponse>().Subject;
        body.IsValid.Should().BeFalse();
        body.NextRunUtc.Should().BeEmpty();
        body.ValidationError.Should().NotBeNullOrWhiteSpace();
    }

    private static Mock<IArchitectureReviewRecurrenceNextRunCalculator> BuildRealRecurrenceCalculator()
    {
        ArchitectureReviewRecurrenceNextRunCalculator real =
            new(new ArchLucid.Decisioning.Advisory.Scheduling.SimpleScanScheduleCalculator());
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> mock = new();
        mock.Setup(c => c.IsSupportedCronExpression(It.IsAny<string>()))
            .Returns((string cron) => real.IsSupportedCronExpression(cron));
        mock.Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns((string cron, DateTime from) => real.ComputeNextRunUtc(cron, from));
        mock.Setup(c => c.ComputeNextRunsUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<int>()))
            .Returns((string cron, DateTime from, int count) => real.ComputeNextRunsUtc(cron, from, count));

        return mock;
    }
}
