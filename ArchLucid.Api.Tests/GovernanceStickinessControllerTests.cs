using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

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
    public async Task GetRiskRegister_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<IGovernanceStickinessFacade> facade = new(MockBehavior.Strict);

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

        GovernanceStickinessController sut = new(
            facade.Object,
            scopeProvider.Object,
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetRiskRegister(projectId: null, maxRows: 50, cancellationToken: CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        facade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRiskRegister_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetRiskRegister(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRiskRegister_returns_bad_request_when_project_id_is_empty_guid()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);
        GovernanceStickinessController sut = BuildSut(riskRegister: riskRegister);

        IActionResult action = await sut.GetRiskRegister(
            projectId: Guid.Empty,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRiskRegister_returns_bad_request_when_max_rows_is_zero()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);
        GovernanceStickinessController sut = BuildSut(riskRegister: riskRegister);

        IActionResult action = await sut.GetRiskRegister(
            projectId: null,
            maxRows: 0,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRiskRegister_returns_bad_request_when_max_rows_exceeds_five_hundred()
    {
        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);
        GovernanceStickinessController sut = BuildSut(riskRegister: riskRegister);

        IActionResult action = await sut.GetRiskRegister(
            projectId: null,
            maxRows: 501,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_recorded_after_is_after_recorded_before()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            recordedAfterUtc: new DateTimeOffset(2026, 8, 1, 0, 0, 0, TimeSpan.Zero),
            recordedBeforeUtc: new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_min_confidence_exceeds_max_confidence()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            minConfidence: 0.9,
            maxConfidence: 0.1,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_buyer_confidence_source_is_unknown()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            buyerConfidenceSource: "Not-a-real-label",
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_ok_when_buyer_confidence_source_is_padded()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            buyerConfidenceSource: " Evidence-backed ",
            cancellationToken: CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Theory]
    [InlineData(-0.1, null)]
    [InlineData(null, 1.1)]
    public async Task GetDecisionRegister_returns_bad_request_when_confidence_bounds_are_out_of_range(
        double? minConfidence,
        double? maxConfidence)
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            minConfidence: minConfidence,
            maxConfidence: maxConfidence,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_max_rows_is_zero()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            maxRows: 0,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_recorded_after_utc_before_1970()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            recordedAfterUtc: new DateTimeOffset(1969, 12, 31, 23, 59, 59, TimeSpan.Zero),
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetDecisionRegister_returns_bad_request_when_category_is_whitespace()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetDecisionRegister(
            projectId: null,
            category: "   ",
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetFindingsRegistersBundle_returns_bad_request_when_max_rows_exceeds_five_hundred()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.GetFindingsRegistersBundle(
            projectId: null,
            maxRows: 501,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.ListRiskExceptions(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetAssignedToMeFindingsCount_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GetAssignedToMeFindingsCount(projectId: null, cancellationToken: CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
    public async Task RecordDisposition_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(sut);

        IActionResult action = await sut.RecordDisposition(
            "finding-1",
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                Disposition = FindingDisposition.Accepted,
                Rationale = "ok",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(sut);

        IActionResult action = await sut.RecordBulkDisposition(
            new RecordBulkFindingDispositionRequest
            {
                FindingIds = ["finding-1"],
                Disposition = FindingDisposition.Accepted,
                Rationale = "bulk",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task CreateRiskException_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.CreateRiskException(
            new CreateRiskExceptionRequest
            {
                FindingId = "finding-1",
                OwnerUserId = "owner@test",
                Rationale = "accepted risk",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.CreateRecurrenceSchedule(
            new CreateArchitectureReviewRecurrenceScheduleRequest
            {
                SourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                IsEnabled = true,
                CronExpression = "0 8 * * 1",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
    public async Task ListDispositions_returns_bad_request_when_finding_id_is_whitespace()
    {
        GovernanceStickinessController controller = BuildSut();

        IActionResult action = await controller.ListDispositions("   ", CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ListDispositions_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.ListDispositions("finding-1", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RevokeRiskException_returns_bad_request_when_risk_exception_id_is_empty()
    {
        GovernanceStickinessController controller = BuildSut();

        IActionResult action = await controller.RevokeRiskException(Guid.Empty, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RevokeRiskException_returns_conflict_when_waiver_is_already_revoked()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        RiskExceptionRecord revokedRecord = new()
        {
            RiskExceptionId = exceptionId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            FindingId = "finding-1",
            OwnerUserId = "owner",
            Rationale = "rationale",
            Status = RiskExceptionStatus.Revoked,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByUserId = "creator",
        };

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revokedRecord);

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revokedRecord);
        riskExceptions
            .Setup(s => s.RevokeAsync(
                Scope.TenantId,
                exceptionId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                Guid tenantId,
                Guid riskExceptionId,
                string revokedByUserId,
                CancellationToken cancellationToken) =>
                riskExceptionService.RevokeAsync(tenantId, riskExceptionId, revokedByUserId, cancellationToken));

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        IActionResult action = await controller.RevokeRiskException(exceptionId, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task RenewRiskException_returns_bad_request_when_risk_exception_id_is_empty()
    {
        GovernanceStickinessController controller = BuildSut();

        IActionResult action = await controller.RenewRiskException(
            Guid.Empty,
            new RenewRiskExceptionRequest { ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30) },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RevokeRiskException_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.RevokeRiskException(
            Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RenewRiskException_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.RenewRiskException(
            Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            new RenewRiskExceptionRequest { ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30) },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpdateRecurrenceSchedule_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.UpdateRecurrenceSchedule(
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            new UpdateArchitectureReviewRecurrenceScheduleRequest { Name = "updated" },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpsertRealizedValueAttestation_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.UpsertRealizedValueAttestation(
            new UpsertRealizedValueAttestationRequest
            {
                AttestedIncidentsAvoided = 1,
                AttestedReviewerTimeSavedNote = "note",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ResolveFindingMergeConflict_returns_bad_request_when_run_id_empty()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.ResolveFindingMergeConflict(
            Guid.Empty,
            "finding-1",
            new ResolveFindingMergeConflictRequest
            {
                Action = FindingMergeConflictResolutionAction.AcceptPrimary,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ResolveFindingMergeConflict_returns_bad_request_when_finding_id_is_whitespace()
    {
        GovernanceStickinessController sut = BuildSut();

        IActionResult action = await sut.ResolveFindingMergeConflict(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            "   ",
            new ResolveFindingMergeConflictRequest
            {
                Action = FindingMergeConflictResolutionAction.AcceptPrimary,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ResolveFindingMergeConflict_returns_not_found_when_tenant_missing()
    {
        GovernanceStickinessController sut = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.ResolveFindingMergeConflict(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            "finding-1",
            new ResolveFindingMergeConflictRequest
            {
                Action = FindingMergeConflictResolutionAction.AcceptPrimary,
            },
            CancellationToken.None);

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
    public async Task RenewRiskException_returns_conflict_when_waiver_is_revoked()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        RiskExceptionRecord revokedRecord = new()
        {
            RiskExceptionId = exceptionId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            FindingId = "finding-1",
            OwnerUserId = "owner",
            Rationale = "rationale",
            Status = RiskExceptionStatus.Revoked,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByUserId = "creator",
        };

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revokedRecord);

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revokedRecord);
        riskExceptions
            .Setup(s => s.RenewAsync(
                Scope.TenantId,
                exceptionId,
                It.IsAny<RenewRiskExceptionRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                Guid tenantId,
                Guid riskExceptionId,
                RenewRiskExceptionRequest request,
                string renewedByUserId,
                CancellationToken cancellationToken) =>
                riskExceptionService.RenewAsync(tenantId, riskExceptionId, request, renewedByUserId, cancellationToken));

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task RenewRiskException_returns_conflict_when_another_active_waiver_exists_for_same_finding()
    {
        const string findingId = "finding-1";
        Guid expiredExceptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid activeExceptionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RiskExceptionRecord expiredRecord = new()
        {
            RiskExceptionId = expiredExceptionId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            FindingId = findingId,
            OwnerUserId = "owner",
            Rationale = "expired waiver",
            Status = RiskExceptionStatus.Expired,
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
            CreatedByUserId = "creator",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
        };

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredRecord);
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository
            .Setup(r => r.GetActiveForScopeFindingAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                findingId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = activeExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "replacement active waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            trail.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, expiredExceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredRecord);
        riskExceptions
            .Setup(s => s.RenewAsync(
                Scope.TenantId,
                expiredExceptionId,
                It.IsAny<RenewRiskExceptionRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                Guid tenantId,
                Guid riskExceptionId,
                RenewRiskExceptionRequest request,
                string renewedByUserId,
                CancellationToken cancellationToken) =>
                riskExceptionService.RenewAsync(tenantId, riskExceptionId, request, renewedByUserId, cancellationToken));

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.RenewRiskException(expiredExceptionId, request, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        repository.Verify(
            r => r.RenewAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewRiskException_returns_bad_request_when_finding_latest_disposition_is_remediated()
    {
        const string findingId = "finding-remediated";
        Guid exceptionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    FindingId = findingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = FindingDisposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        RiskExceptionRecord expiredRecord = new()
        {
            RiskExceptionId = exceptionId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            FindingId = findingId,
            OwnerUserId = "owner",
            Rationale = "expired waiver",
            Status = RiskExceptionStatus.Expired,
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
            CreatedByUserId = "creator",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
        };

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredRecord);
        repository
            .Setup(r => r.MarkExpiredAsync(Scope.TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository
            .Setup(r => r.GetActiveForScopeFindingAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                findingId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RiskExceptionRecord?)null);

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            trail.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredRecord);
        riskExceptions
            .Setup(s => s.RenewAsync(
                Scope.TenantId,
                exceptionId,
                It.IsAny<RenewRiskExceptionRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                Guid tenantId,
                Guid riskExceptionId,
                RenewRiskExceptionRequest request,
                string renewedByUserId,
                CancellationToken cancellationToken) =>
                riskExceptionService.RenewAsync(tenantId, riskExceptionId, request, renewedByUserId, cancellationToken));

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        repository.Verify(
            r => r.RenewAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewRiskException_returns_bad_request_when_evidence_ref_exceeds_max_length()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        RiskExceptionService riskExceptionService = new(
            Mock.Of<IRiskExceptionRepository>(),
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(Scope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });
        riskExceptions
            .Setup(s => s.RenewAsync(
                Scope.TenantId,
                exceptionId,
                It.IsAny<RenewRiskExceptionRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                Guid tenantId,
                Guid riskExceptionId,
                RenewRiskExceptionRequest request,
                string renewedByUserId,
                CancellationToken cancellationToken) =>
                riskExceptionService.RenewAsync(tenantId, riskExceptionId, request, renewedByUserId, cancellationToken));

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_not_found_when_all_findings_are_out_of_scope()
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

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_not_found_when_any_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "in-scope-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "in-scope-finding" });
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        GovernanceStickinessController controller = BuildSut(findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["in-scope-finding", "foreign-finding"],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
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
    public async Task RecordDisposition_returns_bad_request_when_finding_id_is_whitespace()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok",
        };

        IActionResult action = await controller.RecordDisposition("   ", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_finding_id_exceeds_max_length()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);
        string overlongFindingId = new string('f', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = overlongFindingId,
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok",
        };

        IActionResult action = await controller.RecordDisposition(overlongFindingId, request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_finding_id_exceeds_max_length()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);
        string overlongFindingId = new string('f', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [overlongFindingId],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk ok",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_run_id_is_empty()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = Guid.Empty,
            Disposition = FindingDisposition.Accepted,
            Rationale = "ok",
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

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
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
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
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ResourceNotFound);
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
    public async Task CreateRiskException_returns_bad_request_when_finding_id_is_whitespace()
    {
        GovernanceStickinessController controller = BuildSut();

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "   ",
            OwnerUserId = "owner@contoso.com",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_mixed_finding_ids_include_whitespace()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1", "   "],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_finding_id_exceeds_max_length()
    {
        GovernanceStickinessController controller = BuildSut();
        string overlongFindingId = new string('f', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = overlongFindingId,
            RunId = Guid.NewGuid(),
            OwnerUserId = "owner@contoso.com",
            Rationale = "accepted risk rationale",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_owner_user_id_exceeds_max_length_before_facade()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = Guid.NewGuid(),
            OwnerUserId = new string('o', RiskExceptionValidation.OwnerUserIdMaxLength + 1),
            Rationale = "accepted risk rationale",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_rationale_exceeds_max_length_before_facade()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = Guid.NewGuid(),
            OwnerUserId = "owner@contoso.com",
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RenewRiskException_returns_bad_request_when_rationale_exceeds_max_length_before_facade()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RenewRiskException_returns_bad_request_when_evidence_ref_exceeds_max_length_before_facade()
    {
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(riskExceptions: riskExceptions);

        RenewRiskExceptionRequest request = new()
        {
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
        };

        IActionResult action = await controller.RenewRiskException(exceptionId, request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_rationale_exceeds_max_length_and_tenant_missing()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions,
            tenantRepository: TenantMissingRepository());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = Guid.NewGuid(),
            OwnerUserId = "owner@contoso.com",
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateRecurrenceSchedule_returns_bad_request_when_name_exceeds_max_length_and_tenant_missing()
    {
        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            recurrenceRepo: recurrenceRepo,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.UpdateRecurrenceSchedule(
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        recurrenceRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateRecurrenceSchedule_returns_bad_request_when_schedule_id_empty_and_tenant_missing()
    {
        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            recurrenceRepo: recurrenceRepo,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.UpdateRecurrenceSchedule(
            Guid.Empty,
            new UpdateArchitectureReviewRecurrenceScheduleRequest { Name = "updated" },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        recurrenceRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_deferred_revisit_past_and_tenant_missing()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions,
            tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = FindingDisposition.Deferred,
            RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(-1),
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_disposition_is_unrecognized_and_tenant_missing()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions,
            tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = (FindingDisposition)99,
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ResolveFindingMergeConflict_returns_bad_request_when_run_id_empty_and_tenant_missing()
    {
        GovernanceStickinessController controller = BuildSut(tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.ResolveFindingMergeConflict(
            Guid.Empty,
            "finding-1",
            new ResolveFindingMergeConflictRequest
            {
                Action = FindingMergeConflictResolutionAction.AcceptPrimary,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task UpsertRealizedValueAttestation_returns_bad_request_when_attested_incidents_negative_and_tenant_missing()
    {
        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            recurrenceRepo: recurrenceRepo,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.UpsertRealizedValueAttestation(
            new UpsertRealizedValueAttestationRequest
            {
                AttestedIncidentsAvoided = -3,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        recurrenceRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_deferred_without_revisit_and_tenant_missing()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions,
            tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1"],
            Disposition = FindingDisposition.Deferred,
            Rationale = "defer until next quarter",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_rationale_exceeds_max_length_and_tenant_missing()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions,
            tenantRepository: TenantMissingRepository());
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            TradeOffAcknowledgment = "accepted after architecture board review",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_rationale_exceeds_max_length_before_finding_inspect()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            Disposition = FindingDisposition.Accepted,
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            TradeOffAcknowledgment = "accepted after architecture board review",
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_rationale_exceeds_max_length_before_finding_inspect()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            dispositionService: dispositions);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1),
            TradeOffAcknowledgment = "accepted after architecture board review",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_run_id_is_empty()
    {
        GovernanceStickinessController controller = BuildSut();

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = Guid.Empty,
            OwnerUserId = "owner@contoso.com",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_run_id_is_null()
    {
        GovernanceStickinessController controller = BuildSut();

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = null,
            OwnerUserId = "owner@contoso.com",
            Rationale = "accepted risk",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_run_id_does_not_match_finding_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid otherInScopeRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = authorityRunId,
            });

        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs
            .Setup(r => r.GetByIdAsync(Scope, otherInScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = otherInScopeRunId });

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            runRepository: runs,
            riskExceptions: riskExceptions);
        SetIdempotencyKey(controller);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = otherInScopeRunId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        riskExceptions.VerifyNoOtherCalls();
        runs.Verify(
            r => r.GetByIdAsync(Scope, otherInScopeRunId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordDisposition_returns_bad_request_when_run_id_does_not_match_finding_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid otherInScopeRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = authorityRunId,
            });

        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs
            .Setup(r => r.GetByIdAsync(Scope, otherInScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = otherInScopeRunId });

        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            runRepository: runs,
            dispositionService: dispositions);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = otherInScopeRunId,
            Disposition = FindingDisposition.Accepted,
            Rationale = "accepted with mismatched run",
            TradeOffAcknowledgment = "accepted with mismatched run",
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        dispositions.VerifyNoOtherCalls();
        runs.Verify(
            r => r.GetByIdAsync(Scope, otherInScopeRunId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRiskException_returns_not_found_when_run_id_is_out_of_scope()
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

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = foreignRunId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task CreateRiskException_returns_not_found_when_manifest_id_does_not_belong_to_run()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid boundManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignManifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");

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
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                GoldenManifestId = boundManifestId,
            });

        GovernanceStickinessController controller = BuildSut(findingInspect: findingInspect, runRepository: runs);
        SetIdempotencyKey(controller);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = runId,
            ManifestId = foreignManifestId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

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
    public async Task RecordBulkDisposition_returns_bad_request_when_all_finding_ids_are_whitespace()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["", "  "],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_finding_ids_are_duplicated()
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
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == "finding-1"),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1", "finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Duplicate findingId in batch.");

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_padded_finding_ids_normalize_to_duplicates()
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
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == "finding-1"),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [" finding-1 ", "finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Duplicate findingId in batch.");

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_more_than_fifty_finding_ids()
    {
        GovernanceStickinessController controller = BuildSut();
        SetIdempotencyKey(controller);

        List<string> findingIds = Enumerable.Range(0, 51).Select(static i => $"finding-{i}").ToList();

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = findingIds,
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RecordDisposition_returns_ok_when_route_finding_id_is_padded()
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
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == "finding-1"),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

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

        IActionResult action = await controller.RecordDisposition(" finding-1 ", request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordDisposition_returns_ok_when_trade_off_acknowledgment_provided()
    {
        const string tradeOffAcknowledgment = "accepting latency trade-off for lower cost";
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

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
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == "finding-1"
                    && request.TradeOffAcknowledgment == tradeOffAcknowledgment),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect,
            runRepository: runs);
        SetIdempotencyKey(controller);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = runId,
            Disposition = FindingDisposition.Accepted,
            Rationale = "accepted after review",
            TradeOffAcknowledgment = tradeOffAcknowledgment,
        };

        IActionResult action = await controller.RecordDisposition("finding-1", request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_ok_when_finding_ids_are_padded()
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
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == "finding-1"),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [" finding-1 "],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk"
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_deferred_without_revisit_due()
    {
        const string findingId = "finding-bulk-defer-missing-revisit";

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<RecordFindingDispositionRequest, ScopeContext, string, CancellationToken>(
                static (request, _, _, _) => FindingDispositionValidation.Validate(request))
            .ReturnsAsync((RecordFindingDispositionRequest request, ScopeContext _, string __, CancellationToken ___) =>
                new FindingDispositionEventDto { FindingId = request.FindingId });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = FindingDisposition.Deferred,
            Rationale = "defer until next architecture review",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_ok_when_needs_evidence_with_shared_evidence_request_text()
    {
        const string findingId = "finding-bulk-needs-evidence";
        const string evidenceRequestText = "Provide architecture decision record for waiver.";

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == findingId
                    && request.EvidenceRequestText == evidenceRequestText),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<RecordFindingDispositionRequest, ScopeContext, string, CancellationToken>(
                static (request, _, _, _) => FindingDispositionValidation.Validate(request))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = FindingDisposition.NeedsEvidence,
            Rationale = "pending evidence from security review",
            EvidenceRequestText = evidenceRequestText,
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_needs_evidence_without_evidence_request_text()
    {
        const string findingId = "finding-bulk-needs-evidence-missing-text";

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<RecordFindingDispositionRequest, ScopeContext, string, CancellationToken>(
                static (request, _, _, _) => FindingDispositionValidation.Validate(request))
            .ReturnsAsync((RecordFindingDispositionRequest request, ScopeContext _, string __, CancellationToken ___) =>
                new FindingDispositionEventDto { FindingId = request.FindingId });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = FindingDisposition.NeedsEvidence,
            Rationale = "pending evidence from security review",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_waive_rationale_shorter_than_minimum()
    {
        const string findingId = "finding-bulk-waive-short";

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<RecordFindingDispositionRequest, ScopeContext, string, CancellationToken>(
                static (request, _, _, _) => FindingDispositionValidation.Validate(request))
            .ReturnsAsync((RecordFindingDispositionRequest request, ScopeContext _, string __, CancellationToken ___) =>
                new FindingDispositionEventDto { FindingId = request.FindingId });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = FindingDisposition.RejectedAsNotApplicable,
            Rationale = "too short",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_ok_when_accepted_and_shared_rationale_supplies_trade_off()
    {
        const string rationale = "accepted after architecture board review";

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
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == "finding-1"
                    && request.TradeOffAcknowledgment == rationale),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["finding-1"],
            Disposition = FindingDisposition.Accepted,
            Rationale = rationale,
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordBulkDisposition_returns_bad_request_when_list_contains_duplicate_finding_ids()
    {
        const string findingId = "finding-bulk-dup";

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == findingId),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessController controller = BuildSut(
            dispositionService: dispositions,
            findingInspect: findingInspect);
        SetIdempotencyKey(controller);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId, findingId],
            Disposition = FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        IActionResult action = await controller.RecordBulkDisposition(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be("Duplicate findingId in batch.");

        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRiskException_returns_conflict_when_active_waiver_exists_for_finding()
    {
        const string findingId = "finding-1";
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid existingExceptionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = findingId,
                RunId = runId,
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRiskExceptionRepository> repository = new();
        repository
            .Setup(r => r.GetActiveForScopeFindingAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                findingId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = existingExceptionId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                FindingId = findingId,
                OwnerUserId = "owner",
                Rationale = "existing waiver",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            trail.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                CreateRiskExceptionRequest request,
                ScopeContext scope,
                string actor,
                CancellationToken cancellationToken) =>
                riskExceptionService.CreateAsync(request, scope, actor, cancellationToken));

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions,
            runRepository: runs);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = runId,
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt second waiver",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        repository.Verify(
            r => r.CreateAsync(It.IsAny<RiskExceptionRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_finding_latest_disposition_is_remediated()
    {
        const string findingId = "finding-remediated";
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    FindingId = findingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = FindingDisposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Mock<IRiskExceptionRepository> repository = new(MockBehavior.Strict);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
            });

        RiskExceptionService riskExceptionService = new(
            repository.Object,
            trail.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                CreateRiskExceptionRequest request,
                ScopeContext scope,
                string actor,
                CancellationToken cancellationToken) =>
                riskExceptionService.CreateAsync(request, scope, actor, cancellationToken));

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions,
            runRepository: runs);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = runId,
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt waiver on remediated finding",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_evidence_ref_exceeds_max_length()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        RiskExceptionService riskExceptionService = new(
            Mock.Of<IRiskExceptionRepository>(),
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                CreateRiskExceptionRequest request,
                ScopeContext scope,
                string actor,
                CancellationToken cancellationToken) =>
                riskExceptionService.CreateAsync(request, scope, actor, cancellationToken));

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner@contoso.com",
            Rationale = "accepted risk",
            EvidenceRef = new string('e', RiskExceptionValidation.EvidenceRefMaxLength + 1),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_bad_request_when_rationale_shorter_than_minimum_length()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        RiskExceptionService riskExceptionService = new(
            Mock.Of<IRiskExceptionRepository>(),
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<RiskExceptionService>>());

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((
                CreateRiskExceptionRequest request,
                ScopeContext scope,
                string actor,
                CancellationToken cancellationToken) =>
                riskExceptionService.CreateAsync(request, scope, actor, cancellationToken));

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            riskExceptions: riskExceptions);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            OwnerUserId = "owner@contoso.com",
            Rationale = "too short",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRiskException_returns_ok_when_finding_id_is_padded()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = runId,
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(r => r.CreateAsync(
                It.Is<CreateRiskExceptionRequest>(request => request.FindingId == "finding-1"),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord { FindingId = "finding-1" });

        GovernanceStickinessController controller = BuildSut(
            findingInspect: findingInspect,
            runRepository: runs,
            riskExceptions: riskExceptions);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = " finding-1 ",
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        IActionResult action = await controller.CreateRiskException(request, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
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
    public async Task CreateRecurrenceSchedule_returns_bad_request_when_name_exceeds_max_length()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        GovernanceStickinessController controller = BuildSut(runRepository: runs);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
            CronExpression = "0 9 * * 1",
            IsEnabled = true,
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_when_cron_expression_exceeds_max_length()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        GovernanceStickinessController controller = BuildSut(runRepository: runs);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            Name = "weekly review",
            CronExpression = new string('0', RecurrenceScheduleValidation.CronExpressionMaxLength + 1),
            IsEnabled = true,
        };

        IActionResult action = await controller.CreateRecurrenceSchedule(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_when_source_run_is_not_committed()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
                GoldenManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            });

        GovernanceStickinessController controller = BuildSut(runRepository: runs);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            CronExpression = "0 9 * * 1",
            IsEnabled = true,
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
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
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
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
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
    public async Task UpdateRecurrenceSchedule_returns_bad_request_when_schedule_id_is_empty()
    {
        GovernanceStickinessController controller = BuildSut();

        UpdateArchitectureReviewRecurrenceScheduleRequest request = new() { Name = "updated" };

        IActionResult action = await controller.UpdateRecurrenceSchedule(
            Guid.Empty,
            request,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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
    public async Task UpdateRecurrenceSchedule_returns_bad_request_when_name_exceeds_max_length()
    {
        Guid scheduleId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.GetByIdAsync(scheduleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureReviewRecurrenceSchedule
                {
                    ScheduleId = scheduleId,
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    SourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Name = "existing",
                    CronExpression = "0 9 * * 1",
                    IsEnabled = true,
                });

        GovernanceStickinessController controller = BuildSut(recurrenceRepo: recurrenceRepo);

        IActionResult action = await controller.UpdateRecurrenceSchedule(
            scheduleId,
            new UpdateArchitectureReviewRecurrenceScheduleRequest
            {
                Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateRecurrenceSchedule_returns_bad_request_for_invalid_cron()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = sourceRunId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                ArchitectureId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        GovernanceStickinessController controller = BuildSut(
            recurrenceCalculator: BuildRealRecurrenceCalculator(),
            runRepository: runs);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
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
    public void PreviewRecurrenceScheduleRuns_returns_bad_request_when_cron_expression_exceeds_max_length()
    {
        GovernanceStickinessController controller = BuildSut(recurrenceCalculator: BuildRealRecurrenceCalculator());
        string overlongCron = new string('0', RecurrenceScheduleValidation.CronExpressionMaxLength + 1);

        IActionResult action = controller.PreviewRecurrenceScheduleRuns(new PreviewRecurrenceScheduleRunsRequest
        {
            CronExpression = overlongCron,
            Count = 3,
        });

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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
