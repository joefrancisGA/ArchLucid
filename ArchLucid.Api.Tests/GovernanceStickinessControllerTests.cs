using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

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

    private static ITenantRepository TenantExistsRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" }));

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernanceStickinessController BuildSut(
        Mock<IScopeContextProvider>? scopeProvider = null,
        Mock<IFindingDispositionService>? dispositionService = null,
        Mock<IArchitectureRiskRegisterService>? riskRegister = null,
        Mock<IArchitectureReviewRecurrenceScheduleRepository>? recurrenceRepo = null,
        Mock<IArchitectureReviewRecurrenceNextRunCalculator>? recurrenceCalculator = null,
        Mock<IRiskExceptionService>? riskExceptions = null,
        Mock<IFindingInspectReadRepository>? findingInspect = null,
        Mock<IRunRepository>? runRepository = null,
        IRealizedValueAttestationService? attestationService = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = scopeProvider ?? new Mock<IScopeContextProvider>();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("reviewer@test");

        Mock<IFindingDispositionService> dispositions = dispositionService ?? new Mock<IFindingDispositionService>();
        dispositions
            .Setup(d => d.ListHistoryAsync(Scope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<FindingDispositionEventDto>());

        Mock<IRiskExceptionService> riskExceptionService = riskExceptions ?? new Mock<IRiskExceptionService>();
        riskExceptionService
            .Setup(r => r.ListActiveAsync(Scope.TenantId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());

        Mock<IArchitectureRiskRegisterService> riskRegisterService = riskRegister ?? new Mock<IArchitectureRiskRegisterService>();

        if (riskRegister is null)
        {
            riskRegisterService
                .Setup(r => r.GetRegisterAsync(
                    Scope.TenantId,
                    Scope.WorkspaceId,
                    Scope.ProjectId,
                    It.IsAny<int>(),
                    It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ArchitectureRiskRegisterResponse());

            riskRegisterService
                .Setup(r => r.CountAsync(
                    Scope.TenantId,
                    Scope.WorkspaceId,
                    Scope.ProjectId,
                    It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);
        }

        Mock<IArchitectureDecisionRegisterService> decisionRegister = new();
        decisionRegister
            .Setup(d => d.GetRegisterAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
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
                .Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<bool>()))
                .Returns((string _, DateTime _, bool enabled) => enabled ? DateTime.UtcNow.AddDays(7) : null);
        }

        Mock<IGovernanceDigestDecisionNeededComposer> digestComposer = new();
        digestComposer
            .Setup(c => c.BuildSummaryAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, It.IsAny<CancellationToken>()))
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
                new GovernanceStickinessFacade(
                    scope.Object,
                    actor.Object,
                    dispositions.Object,
                    riskExceptionService.Object,
                    riskRegisterService.Object,
                    decisionRegister.Object,
                    recurrenceRepository.Object,
                    nextRun.Object,
                    runRepository?.Object ?? Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
                    Mock.Of<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>(),
                    digestComposer.Object,
                    reviewsAwaiting.Object,
                    attestationService ?? Mock.Of<IRealizedValueAttestationService>(),
                    audit.Object,
                    findingInspect?.Object ?? Mock.Of<IFindingInspectReadRepository>()),
                scope.Object,
                tenantRepository ?? TenantExistsRepository())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    private static GovernanceStickinessController BuildController(
        IScopeContextProvider scopeProvider,
        IActorContext actorContext,
        IArchitectureRiskRegisterService riskRegister,
        IGovernanceDigestDecisionNeededComposer? digestComposer = null,
        IReviewsAwaitingActionQueryService? reviewsAwaiting = null,
        ITenantRepository? tenantRepository = null)
    {
        return new GovernanceStickinessController(
                new GovernanceStickinessFacade(
                    scopeProvider,
                    actorContext,
                    Mock.Of<IFindingDispositionService>(),
                    Mock.Of<IRiskExceptionService>(),
                    riskRegister,
                    Mock.Of<IArchitectureDecisionRegisterService>(),
                    Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
                    Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
                    Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
                    Mock.Of<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>(),
                    digestComposer ?? Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
                    reviewsAwaiting ?? Mock.Of<IReviewsAwaitingActionQueryService>(),
                    Mock.Of<IRealizedValueAttestationService>(),
                    Mock.Of<IAuditService>(),
                    Mock.Of<IFindingInspectReadRepository>()),
                scopeProvider,
                tenantRepository ?? TenantExistsRepository())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    [Fact]
    public async Task GetRealizedValueAttestation_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetRealizedValueAttestation(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListRecurrenceSchedules_returns_not_found_when_tenant_missing()
    {
        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new(MockBehavior.Strict);

        GovernanceStickinessController sut = BuildSut(
            recurrenceRepo: recurrenceRepo,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.ListRecurrenceSchedules(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        recurrenceRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRiskRegister_returns_not_found_when_tenant_missing()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        GovernanceStickinessController sut = BuildSut(
            riskRegister: riskRegister,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetRiskRegister(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetDecisionsNeededSummary_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetDecisionsNeededSummary(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ListRiskExceptions_returns_not_found_when_tenant_missing()
    {
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController sut = BuildSut(
            riskExceptions: riskExceptions,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.ListRiskExceptions(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetAssignedToMeFindingsCount_returns_not_found_when_tenant_missing()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        GovernanceStickinessController sut = BuildSut(
            riskRegister: riskRegister,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetAssignedToMeFindingsCount(projectId: null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetReviewsAwaitingAction_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetReviewsAwaitingAction(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetFindingsRegistersBundle_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetFindingsRegistersBundle(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetDecisionRegister(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRiskRegister_returns_service_payload()
    {
        ArchitectureRiskRegisterResponse expected = new();
        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(r => r.GetRegisterAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                200,
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        GovernanceStickinessController controller = BuildSut(riskRegister: riskRegister);

        IActionResult action = await controller.GetRiskRegister(
            projectId: null,
            maxRows: 200,
            assignedToMe: false,
            cancellationToken: CancellationToken.None);

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
                Scope.WorkspaceId,
                Scope.ProjectId,
                200,
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Guid?, int, ArchitectureRiskRegisterListOptions?, CancellationToken>(
                (_, _, _, _, options, _) => capturedOptions = options)
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActor()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActorId()).Returns("assignee-guid");

        GovernanceStickinessController sut = BuildController(
            scopeProvider.Object,
            actor.Object,
            riskRegister.Object);

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
    public async Task GetAssignedToMeFindingsCount_returns_service_count()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(r => r.CountAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActor()).Returns("assignee@example.com");
        actor.Setup(context => context.GetActorId()).Returns("assignee-guid");

        GovernanceStickinessController sut = BuildController(
            scopeProvider.Object,
            actor.Object,
            riskRegister.Object);

        IActionResult action = await sut.GetAssignedToMeFindingsCount(
            projectId: null,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GovernanceAssignedToMeFindingsCountResponse body =
            ok.Value.Should().BeOfType<GovernanceAssignedToMeFindingsCountResponse>().Subject;
        body.Count.Should().Be(7);
    }

    [Fact]
    public async Task GetAssignedToMeFindingsCount_when_no_identities_returns_zero_without_service_call()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.TryGetSubmitterMailbox()).Returns((string?)null);
        actor.Setup(context => context.GetActor()).Returns(string.Empty);
        actor.Setup(context => context.GetActorId()).Returns(string.Empty);

        GovernanceStickinessController sut = BuildController(
            scopeProvider.Object,
            actor.Object,
            riskRegister.Object);

        IActionResult action = await sut.GetAssignedToMeFindingsCount(
            projectId: null,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GovernanceAssignedToMeFindingsCountResponse body =
            ok.Value.Should().BeOfType<GovernanceAssignedToMeFindingsCountResponse>().Subject;
        body.Count.Should().Be(0);
        riskRegister.Verify(
            service => service.CountAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
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

        GovernanceStickinessController sut = BuildController(
            scopeProvider.Object,
            actor.Object,
            riskRegister.Object);

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
    public async Task RenewRiskException_returns_not_found_when_exception_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = foreignWorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_all_findings_are_out_of_scope()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["foreign-finding-1", "foreign-finding-2"],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

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
        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("invalid disposition"));

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
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
    public async Task RecordDisposition_returns_not_found_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        GovernanceStickinessController controller = BuildSut(findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "foreign-finding",
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok"
        };

        IActionResult action = await controller.RecordDisposition("foreign-finding", request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RecordDisposition_returns_not_found_when_run_id_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessController controller = BuildSut(findingInspect: findingInspect, runRepository: runs);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = foreignRunId,
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok"
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
    public async Task CreateRecurrenceSchedule_returns_not_found_when_source_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessController controller = BuildSut(runRepository: runs);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = foreignRunId,
            IsEnabled = true,
            CronExpression = "0 8 * * 1",
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            });

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo, runRepository: runs);

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
        captured.NextRunUtc.Should().BeNull();
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

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            });

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo, runRepository: runs);

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

    [Fact]
    public async Task ResolveFindingMergeConflict_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessController controller = BuildSut(runRepository: runs);

        ResolveFindingMergeConflictRequest request = new()
        {
            Action = FindingMergeConflictResolutionAction.AcceptPrimary,
        };

        IActionResult action = await controller.ResolveFindingMergeConflict(
            foreignRunId,
            "conflict-finding",
            request,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpsertRealizedValueAttestation_returns_not_found_when_tenant_missing()
    {
        RealizedValueAttestationService attestationService = new(Mock.Of<ArchLucid.Persistence.Tenancy.ITenantSettingsRepository>(MockBehavior.Strict));
        GovernanceStickinessController controller = BuildSut(
            attestationService: attestationService,
            tenantRepository: TenantMissingRepository());

        UpsertRealizedValueAttestationRequest request = new()
        {
            AttestedIncidentsAvoided = 2,
        };

        IActionResult action = await controller.UpsertRealizedValueAttestation(request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpsertRealizedValueAttestation_returns_bad_request_when_attested_incidents_negative()
    {
        RealizedValueAttestationService attestationService = new(Mock.Of<ArchLucid.Persistence.Tenancy.ITenantSettingsRepository>());
        GovernanceStickinessController controller = BuildSut(attestationService: attestationService);

        UpsertRealizedValueAttestationRequest request = new()
        {
            AttestedIncidentsAvoided = -3,
        };

        IActionResult action = await controller.UpsertRealizedValueAttestation(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    private static Mock<IArchitectureReviewRecurrenceNextRunCalculator> BuildRealRecurrenceCalculator()
    {
        ArchitectureReviewRecurrenceNextRunCalculator real =
            new(new ArchLucid.Decisioning.Advisory.Scheduling.SimpleScanScheduleCalculator());
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> mock = new();
        mock.Setup(c => c.IsSupportedCronExpression(It.IsAny<string>()))
            .Returns((string cron) => real.IsSupportedCronExpression(cron));
        mock.Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<bool>()))
            .Returns((string cron, DateTime from, bool enabled) => real.ComputeNextRunUtc(cron, from, enabled));
        mock.Setup(c => c.ComputeNextRunsUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<int>()))
            .Returns((string cron, DateTime from, int count) => real.ComputeNextRunsUtc(cron, from, count));

        return mock;
    }
}
