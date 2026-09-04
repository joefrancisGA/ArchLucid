using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceMutationCorrectionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task RecordAsync_appends_correction_audit_without_mutating_approval_row()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string approvalRequestId = "apr-correction-1";
        List<AuditEvent> auditEvents = [];

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
                Status = GovernanceApprovalStatus.Approved,
            });

        Mock<IRunRepository> runs = CreateScopedRunRepository(runId);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => auditEvents.Add(evt))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            runs.Object,
            auditService.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = approvalRequestId,
                RunId = runId,
                Rationale = "Approved the wrong review package.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.MutationKind.Should().Be(GovernanceMutationCorrectionKinds.QuickApprove);
        result.SubjectId.Should().Be(approvalRequestId);
        result.Rationale.Should().Be("Approved the wrong review package.");
        auditEvents.Should().ContainSingle();
        auditEvents[0].EventType.Should().Be(AuditEventTypes.GovernanceMutationCorrectionRecorded);
        auditEvents[0].DataJson.Should().Contain(approvalRequestId);
        approvals.Verify(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()), Times.Once);
        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordAsync_requires_non_empty_rationale()
    {
        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowApprove,
                SubjectId = "apr-1",
                RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                Rationale = "   ",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task RecordAsync_appends_correction_for_keyboard_finding_disposition_without_mutating_trail()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string findingId = "finding-keyboard-1";
        List<AuditEvent> auditEvents = [];

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(r => r.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    FindingId = findingId,
                    ReviewerUserId = "operator-1",
                    Action = FindingReviewAction.RecordDisposition,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                    RunId = Guid.Parse(runId),
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                },
            ]);

        Mock<IRunRepository> runs = CreateScopedRunRepository(runId);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => auditEvents.Add(evt))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            runs.Object,
            auditService.Object,
            trail.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.KeyboardFindingDisposition,
                SubjectId = findingId,
                RunId = runId,
                Rationale = "Accepted the wrong finding via keyboard shortcut.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.MutationKind.Should().Be(GovernanceMutationCorrectionKinds.KeyboardFindingDisposition);
        result.SubjectId.Should().Be(findingId);
        auditEvents.Should().ContainSingle();
        auditEvents[0].EventType.Should().Be(AuditEventTypes.GovernanceMutationCorrectionRecorded);
        trail.Verify(r => r.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()), Times.Once);
        trail.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordAsync_rejects_keyboard_disposition_correction_when_trail_run_id_is_null()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string findingId = "finding-keyboard-1";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(r => r.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    FindingId = findingId,
                    ReviewerUserId = "operator-1",
                    Action = FindingReviewAction.RecordDisposition,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                    RunId = null,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                },
            ]);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object,
            trail.Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.KeyboardFindingDisposition,
                SubjectId = findingId,
                RunId = runId,
                Rationale = "Wrong keyboard disposition.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task RecordAsync_throws_conflict_when_approval_request_is_not_yet_approved()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string approvalRequestId = "apr-pending-1";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
                Status = GovernanceApprovalStatus.Submitted,
            });

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowApprove,
                SubjectId = approvalRequestId,
                RunId = runId,
                Rationale = "Premature correction attempt.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RecordAsync_appends_correction_for_bulk_disposition_when_trail_has_authority_run_id()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string findingId = "finding-bulk-correction-1";
        List<AuditEvent> auditEvents = [];

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(r => r.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    FindingId = findingId,
                    ReviewerUserId = "operator-1",
                    Action = FindingReviewAction.RecordDisposition,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                    RunId = Guid.Parse(runId),
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                },
            ]);

        Mock<IRunRepository> runs = CreateScopedRunRepository(runId);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => auditEvents.Add(evt))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            runs.Object,
            auditService.Object,
            trail.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.BulkDisposition,
                SubjectId = findingId,
                RunId = runId,
                Rationale = "Bulk disposition applied to wrong finding set.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.MutationKind.Should().Be(GovernanceMutationCorrectionKinds.BulkDisposition);
        result.SubjectId.Should().Be(findingId);
        auditEvents.Should().ContainSingle();
    }

    [Fact]
    public async Task RecordAsync_throws_conflict_when_environment_activation_is_superseded()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string activationId = "activation-superseded-1";

        Mock<IGovernanceEnvironmentActivationRepository> activations = new();
        activations
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new GovernanceEnvironmentActivation
                {
                    ActivationId = activationId,
                    RunId = runId,
                    IsActive = false,
                },
            ]);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object,
            activationRepo: activations.Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowActivate,
                SubjectId = activationId,
                RunId = runId,
                Rationale = "Correction on superseded activation.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RecordAsync_rejects_disposition_correction_when_subject_id_exceeds_max_finding_id_length()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        string overlongFindingId = new string('f', FindingDispositionValidation.MaxFindingIdLength + 1);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.KeyboardFindingDisposition,
                SubjectId = overlongFindingId,
                RunId = runId,
                Rationale = "Keyboard disposition applied to wrong finding.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaxFindingIdLength}*");
    }

    [Fact]
    public async Task RecordAsync_rejects_approval_correction_when_subject_id_exceeds_max_length()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        string overlongApprovalRequestId = new string('a', FindingDispositionValidation.MaxFindingIdLength + 1);

        Mock<IGovernanceApprovalRequestRepository> approvals = new(MockBehavior.Strict);

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = overlongApprovalRequestId,
                RunId = runId,
                Rationale = "Approval recorded on wrong request id.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaxFindingIdLength}*");

        approvals.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordAsync_rejects_correction_when_rationale_is_shorter_than_minimum_length()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string approvalRequestId = "apr-correction-1";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
                Status = GovernanceApprovalStatus.Approved,
            });

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = approvalRequestId,
                RunId = runId,
                Rationale = "too short",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"*at least {FindingDispositionValidation.MinimumRationaleLength}*");
    }

    [Fact]
    public async Task RecordAsync_rejects_correction_when_rationale_exceeds_maximum_length()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string approvalRequestId = "apr-correction-1";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = runId,
                Status = GovernanceApprovalStatus.Approved,
            });

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            CreateScopedRunRepository(runId).Object,
            new Mock<IAuditService>().Object);

        string overlongRationale = new string('r', FindingDispositionValidation.MaximumRationaleLength + 1);

        Func<Task> act = () => sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = approvalRequestId,
                RunId = runId,
                Rationale = overlongRationale,
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"*exceed*{FindingDispositionValidation.MaximumRationaleLength}*");
    }

    private static GovernanceMutationCorrectionService CreateSut(
        IGovernanceApprovalRequestRepository approvalRepo,
        IRunRepository runRepository,
        IAuditService auditService,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        IGovernanceEnvironmentActivationRepository? activationRepo = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new GovernanceMutationCorrectionService(
            approvalRepo,
            new Mock<IGovernancePromotionRecordRepository>().Object,
            activationRepo ?? new Mock<IGovernanceEnvironmentActivationRepository>().Object,
            findingReviewTrailRepository ?? new Mock<IFindingReviewTrailRepository>().Object,
            scopeProvider.Object,
            runRepository,
            auditService,
            NullLogger<GovernanceMutationCorrectionService>.Instance);
    }

    private static Mock<IRunRepository> CreateScopedRunRepository(string runId)
    {
        Guid runGuid = Guid.Parse(runId);
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = runGuid });

        return runs;
    }
}
