using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Proves draft/wizard intake mutations map service-thrown <see cref="ConflictException" />
///     to OpenAPI **409** (not unhandled 500), complementing pre-read sealed-manifest guards.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftIntakeSealedManifestRuntimeConflictTests
{
    private const string SealedConflictMessage =
        "Draft intake is blocked because a committed run sealed-manifest hash drifted.";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly ConflictException SealedConflict = new(SealedConflictMessage);

    private static void AssertSealedManifestConflict409(IActionResult action)
    {
        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(SealedConflictMessage);
    }

    private static WizardIntakeDraftsController BuildWizardSut(Mock<IWizardIntakeDraftService> service)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<ArchLucid.Core.Tenancy.ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Core.Tenancy.TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new ArchLucid.Core.Tenancy.TenantWorkspaceListItem
                {
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return new WizardIntakeDraftsController(
            scopeProvider.Object,
            tenants.Object,
            service.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    private static (
        DraftRequestsController Controller,
        Mock<IDraftRequestService> Service,
        Mock<IDraftIntakeReasoningService> Reasoning,
        Mock<IAuditService> Audit) BuildDraftSut()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActor()).Returns("op-display");
        actorContext.Setup(static a => a.GetActorId()).Returns("op-id");

        Mock<IDraftRequestService> service = new();
        Mock<IDraftIntakeReasoningService> reasoning = new();
        Mock<IAuditService> audit = new();

        DraftRequestsController controller = new(
            scopeProvider.Object,
            actorContext.Object,
            service.Object,
            reasoning.Object,
            Mock.Of<IDecisionReceiptService>(),
            audit.Object,
            Mock.Of<IArchitectureWorkLeaseService>(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        return (controller, service, reasoning, audit);
    }

    [Fact]
    public async Task UpsertDraft_maps_service_ConflictException_to_409()
    {
        UpsertWizardIntakeDraftRequest body = new()
        {
            StepIndex = 1,
            StateJson = "{}",
            IdempotencyKey = "idem-1",
        };
        Mock<IWizardIntakeDraftService> service = new(MockBehavior.Strict);
        service
            .Setup(s => s.UpsertAsync(Scope, "wizard-1", body, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        WizardIntakeDraftsController sut = BuildWizardSut(service);

        IActionResult action = await sut.UpsertDraft("wizard-1", body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task AbandonDraft_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.AbandonAsync(Scope, DraftId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.AbandonDraft(DraftId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReopenDraft_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.ReopenAsync(Scope, DraftId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.ReopenDraft(DraftId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CloneDraftSnapshot_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.CloneSnapshotAsync(Scope, DraftId, "op-id", It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.CloneDraftSnapshot(DraftId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AdmitDraft_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.RequestAdmissionAsync(Scope, DraftId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.AdmitDraft(DraftId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AnswerQuestion_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        AnswerDraftQuestionRequest body = new()
        {
            QuestionKey = "l0.pillar.cost",
            Answer = "Within budget.",
        };
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.AnswerQuestionAsync(Scope, DraftId, body, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.AnswerQuestion(DraftId, body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SkipQuestion_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        SkipDraftQuestionRequest body = new() { QuestionKey = "l0.pillar.cost" };
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.SkipQuestionAsync(Scope, DraftId, body, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.SkipQuestion(DraftId, body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReasonDraft_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        DraftIntakeReasonRequest body = new() { Message = "Why is cost a pillar?" };
        (DraftRequestsController sut, _, Mock<IDraftIntakeReasoningService> reasoning, Mock<IAuditService> audit) = BuildDraftSut();
        reasoning
            .Setup(s => s.ReasonAsync(DraftId, body, Scope, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.ReasonDraft(DraftId, body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BranchDraft_maps_service_ConflictException_to_409_and_does_not_audit()
    {
        BranchDraftRequest body = new()
        {
            OverrideKind = DraftBranchOverrideKind.FreeTextIntent,
            OverrideValue = "Branch intent variant.",
        };
        (DraftRequestsController sut, Mock<IDraftRequestService> service, _, Mock<IAuditService> audit) = BuildDraftSut();
        service
            .Setup(s => s.BranchAsync(Scope, DraftId, "op-id", body, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.BranchDraft(DraftId, body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
