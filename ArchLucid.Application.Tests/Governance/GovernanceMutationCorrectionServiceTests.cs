using ArchLucid.Application.Analysis;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

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
    public async Task RecordAsync_accepts_dashed_run_id_when_approval_stores_canonical_n()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string persistedRunId = runGuid.ToString("N");
        string requestedRunId = runGuid.ToString("D");
        const string approvalRequestId = "apr-correction-format";

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync(approvalRequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = approvalRequestId,
                RunId = persistedRunId,
                Status = GovernanceApprovalStatus.Approved,
            });

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            approvals.Object,
            CreateScopedRunRepository(requestedRunId).Object,
            auditService.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.QuickApprove,
                SubjectId = approvalRequestId,
                RunId = requestedRunId,
                Rationale = "Approved the wrong review package.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.SubjectId.Should().Be(approvalRequestId);
        result.RunId.Should().Be(requestedRunId);
    }

    [Fact]
    public async Task RecordAsync_accepts_dashed_run_id_when_promotion_stores_canonical_n()
    {
        Guid runGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string persistedRunId = runGuid.ToString("N");
        string requestedRunId = runGuid.ToString("D");
        const string promotionRecordId = "promo-correction-format";
        InMemoryGovernancePromotionRecordRepository promotions = new();
        await promotions.CreateAsync(new GovernancePromotionRecord
        {
            PromotionRecordId = promotionRecordId,
            RunId = persistedRunId,
            ManifestVersion = "v1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            PromotedBy = "operator-1",
        });

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(requestedRunId).Object,
            auditService.Object,
            promotionRepository: promotions);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowPromote,
                SubjectId = promotionRecordId,
                RunId = requestedRunId,
                Rationale = "Promoted the wrong manifest version.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.SubjectId.Should().Be(promotionRecordId);
    }

    [Fact]
    public async Task RecordAsync_accepts_dashed_run_id_when_activation_stores_canonical_n()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string persistedRunId = runGuid.ToString("N");
        string requestedRunId = runGuid.ToString("D");
        const string activationId = "act-correction-format";
        InMemoryGovernanceEnvironmentActivationRepository activations = new();
        await activations.CreateAsync(new GovernanceEnvironmentActivation
        {
            ActivationId = activationId,
            RunId = persistedRunId,
            ManifestVersion = "v1",
            Environment = "prod",
            IsActive = true,
        });

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(requestedRunId).Object,
            auditService.Object,
            activationRepository: activations);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.WorkflowActivate,
                SubjectId = activationId,
                RunId = requestedRunId,
                Rationale = "Activated the wrong environment baseline.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.SubjectId.Should().Be(activationId);
    }

    [Fact]
    public async Task RecordAsync_accepts_dashed_run_id_when_finalize_subject_is_canonical_n()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string persistedRunId = runGuid.ToString("N");
        string requestedRunId = runGuid.ToString("D");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceMutationCorrectionService sut = CreateSut(
            new Mock<IGovernanceApprovalRequestRepository>().Object,
            CreateScopedRunRepository(requestedRunId).Object,
            auditService.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.ArchitectureReviewFinalize,
                SubjectId = persistedRunId,
                RunId = requestedRunId,
                Rationale = "Finalized the wrong review package.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.SubjectId.Should().Be(persistedRunId);
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

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                FindingInspectReadOptions.MetadataOnly))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = findingId,
                RunId = Guid.Parse(runId),
            });

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
            trail.Object,
            findingInspect.Object);

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
    public async Task RecordAsync_appends_correction_for_keyboard_finding_disposition_when_subject_id_differs_only_by_casing()
    {
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string canonicalFindingId = "FIND-KEYBOARD-1";
        List<AuditEvent> auditEvents = [];

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "find-keyboard-1",
                It.IsAny<CancellationToken>(),
                FindingInspectReadOptions.MetadataOnly))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = canonicalFindingId,
                RunId = Guid.Parse(runId),
            });

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(r => r.ListByFindingAsync(Scope.TenantId, canonicalFindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    FindingId = canonicalFindingId,
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
            trail.Object,
            findingInspect.Object);

        GovernanceMutationCorrectionRecordedDto result = await sut.RecordAsync(
            new RecordGovernanceMutationCorrectionRequest
            {
                MutationKind = GovernanceMutationCorrectionKinds.KeyboardFindingDisposition,
                SubjectId = "find-keyboard-1",
                RunId = runId,
                Rationale = "Accepted the wrong finding via keyboard shortcut.",
            },
            Scope,
            "operator-1",
            CancellationToken.None);

        result.MutationKind.Should().Be(GovernanceMutationCorrectionKinds.KeyboardFindingDisposition);
        result.SubjectId.Should().Be(canonicalFindingId);
        auditEvents.Should().ContainSingle();
        auditEvents[0].DataJson.Should().Contain(canonicalFindingId);
        trail.Verify(r => r.ListByFindingAsync(Scope.TenantId, canonicalFindingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static GovernanceMutationCorrectionService CreateSut(
        IGovernanceApprovalRequestRepository approvalRepo,
        IRunRepository runRepository,
        IAuditService auditService,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        IFindingInspectReadRepository? findingInspectReadRepository = null,
        IGovernancePromotionRecordRepository? promotionRepository = null,
        IGovernanceEnvironmentActivationRepository? activationRepository = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new GovernanceMutationCorrectionService(
            approvalRepo,
            promotionRepository ?? new Mock<IGovernancePromotionRecordRepository>().Object,
            activationRepository ?? new Mock<IGovernanceEnvironmentActivationRepository>().Object,
            findingReviewTrailRepository ?? new Mock<IFindingReviewTrailRepository>().Object,
            findingInspectReadRepository ?? new Mock<IFindingInspectReadRepository>().Object,
            scopeProvider.Object,
            runRepository,
            CreateAuthorityQueryService(runRepository).Object,
            CreateManifestHashService().Object,
            auditService,
            NullLogger<GovernanceMutationCorrectionService>.Instance);
    }

    private static Mock<IAuthorityQueryService> CreateAuthorityQueryService(IRunRepository runRepository)
    {
        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
            {
                ManifestDocument manifest = new()
                {
                    RunId = runId,
                    ManifestHash = "SEALED-HASH",
                };

                return new RunDetailDto
                {
                    Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                    GoldenManifest = manifest,
                };
            });

        return query;
    }

    private static Mock<IManifestHashService> CreateManifestHashService()
    {
        Mock<IManifestHashService> hashService = new();
        hashService
            .Setup(h => h.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("SEALED-HASH");

        return hashService;
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
