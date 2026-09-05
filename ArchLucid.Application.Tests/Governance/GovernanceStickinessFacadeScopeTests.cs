using ArchLucid.Application;
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
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceStickinessFacadeScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetRiskRegisterAsync_returns_empty_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(riskRegister: riskRegister.Object);

        ArchitectureRiskRegisterResponse response = await sut.GetRiskRegisterAsync(
            foreignProjectId,
            maxRows: 50,
            assignedToMe: false,
            CancellationToken.None);

        response.Entries.Should().BeEmpty();
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDispositionAsync_throws_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        GovernanceStickinessFacade sut = CreateSut(findingInspect: findings.Object);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "foreign-finding",
            RunId = Guid.NewGuid(),
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "accepted",
        };

        Func<Task> act = () => sut.RecordDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Finding was not found*");
    }

    [Fact]
    public async Task ListDispositionsAsync_returns_empty_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            dispositionService: dispositions.Object);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListDispositionsAsync("foreign-finding", CancellationToken.None);

        history.Should().BeEmpty();
        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDispositionAsync_throws_when_run_id_does_not_match_finding_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid otherInScopeRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
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
            .Setup(r => r.GetByIdAsync(CallerScope, otherInScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = otherInScopeRunId });

        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            runRepository: runs.Object,
            dispositionService: dispositions.Object);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = otherInScopeRunId,
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "accepted with mismatched run",
            TradeOffAcknowledgment = "accepted with mismatched run",
        };

        Func<Task> act = () => sut.RecordDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*authority run*");

        dispositions.VerifyNoOtherCalls();
        runs.Verify(
            r => r.GetByIdAsync(CallerScope, otherInScopeRunId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordDispositionAsync_throws_when_run_id_omitted_and_finding_has_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = authorityRunId,
            });

        Mock<IFindingDispositionService> dispositions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            dispositionService: dispositions.Object);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = null,
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "accepted without run binding",
            TradeOffAcknowledgment = "accepted without run binding",
        };

        Func<Task> act = () => sut.RecordDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*required*authority run*");

        dispositions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RecordDispositionAsync_throws_when_run_id_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            runRepository: runs.Object);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = foreignRunId,
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "accepted",
        };

        Func<Task> act = () => sut.RecordDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>()
            .WithMessage($"*'{foreignRunId:D}'*");
    }

    [Fact]
    public async Task GetAssignedToMeFindingsCountAsync_returns_zero_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("reviewer@example.com");
        actor.Setup(a => a.GetActorId()).Returns("actor-guid-123");

        GovernanceStickinessFacade sut = CreateSut(
            riskRegister: riskRegister.Object,
            actor: actor.Object);

        int count = await sut.GetAssignedToMeFindingsCountAsync(foreignProjectId, CancellationToken.None);

        count.Should().Be(0);
        riskRegister.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryResolveFindingMergeConflictAsync_returns_false_when_conflict_not_on_run_snapshot()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        const string sealedManifestHash = "sealed-manifest-hash-for-merge-conflict-negative";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = runId });

        Mock<IFindingInspectReadRepository> findings = new(MockBehavior.Strict);

        Mock<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService> merge = new();
        merge
            .Setup(s => s.TryResolveAsync(
                CallerScope,
                runId,
                "foreign-finding",
                FindingMergeConflictResolutionAction.AcceptPrimary,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(FindingMergeConflictResolveResult.NotFound);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                CallerScope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = sealedManifestHash,
                },
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(sealedManifestHash);

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            findingInspect: findings.Object,
            mergeConflictResolution: merge.Object,
            authorityQuery: authority.Object,
            manifestHashService: manifestHash.Object);

        ResolveFindingMergeConflictRequest request = new()
        {
            Action = FindingMergeConflictResolutionAction.AcceptPrimary,
        };

        bool resolved = await sut.TryResolveFindingMergeConflictAsync(
            runId,
            "foreign-finding",
            request,
            CancellationToken.None);

        resolved.Should().BeFalse();
        findings.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryResolveFindingMergeConflictAsync_logs_canonical_finding_id_when_route_differs_only_by_casing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        const string routeFindingId = "conflict-1";
        const string canonicalFindingId = "CONFLICT-1";
        const string sealedManifestHash = "sealed-manifest-hash-for-merge-conflict-audit";
        List<AuditEvent> auditEvents = [];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = runId });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                routeFindingId,
                It.IsAny<CancellationToken>(),
                FindingInspectReadOptions.MetadataOnly))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = canonicalFindingId,
                RunId = runId,
            });

        Mock<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService> merge = new();
        merge
            .Setup(s => s.TryResolveAsync(
                CallerScope,
                runId,
                routeFindingId,
                FindingMergeConflictResolutionAction.AcceptPrimary,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(FindingMergeConflictResolveResult.Resolved);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                CallerScope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = sealedManifestHash,
                },
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(sealedManifestHash);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            findingInspect: findings.Object,
            mergeConflictResolution: merge.Object,
            auditService: auditService.Object,
            authorityQuery: authority.Object,
            manifestHashService: manifestHash.Object);

        ResolveFindingMergeConflictRequest request = new()
        {
            Action = FindingMergeConflictResolutionAction.AcceptPrimary,
        };

        bool resolved = await sut.TryResolveFindingMergeConflictAsync(
            runId,
            routeFindingId,
            request,
            CancellationToken.None);

        resolved.Should().BeTrue();
        auditEvents.Should().ContainSingle();
        auditEvents[0].EventType.Should().Be(AuditEventTypes.FindingMergeConflictResolved);
        auditEvents[0].DataJson.Should().Contain(canonicalFindingId);
        auditEvents[0].DataJson.Should().NotContain(routeFindingId);
    }

    [Fact]
    public async Task TryResolveFindingMergeConflictAsync_returns_true_without_duplicate_audit_when_already_resolved_retry()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        const string conflictFindingId = "CONFLICT-1";
        const string sealedManifestHash = "sealed-manifest-hash-for-merge-conflict-idempotent-retry";
        List<AuditEvent> auditEvents = [];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = runId });

        Mock<IFindingInspectReadRepository> findings = new(MockBehavior.Strict);

        Mock<IFindingMergeConflictResolutionService> merge = new();
        merge
            .Setup(s => s.TryResolveAsync(
                CallerScope,
                runId,
                conflictFindingId,
                FindingMergeConflictResolutionAction.AcceptPrimary,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(FindingMergeConflictResolveResult.AlreadyResolved);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                CallerScope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new ArchLucid.Persistence.Models.RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = sealedManifestHash,
                },
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(sealedManifestHash);

        Mock<IAuditService> auditService = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            findingInspect: findings.Object,
            mergeConflictResolution: merge.Object,
            auditService: auditService.Object,
            authorityQuery: authority.Object,
            manifestHashService: manifestHash.Object);

        ResolveFindingMergeConflictRequest request = new()
        {
            Action = FindingMergeConflictResolutionAction.AcceptPrimary,
        };

        bool resolved = await sut.TryResolveFindingMergeConflictAsync(
            runId,
            conflictFindingId,
            request,
            CancellationToken.None);

        resolved.Should().BeTrue();
        auditEvents.Should().BeEmpty();
        findings.VerifyNoOtherCalls();
        auditService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryResolveFindingMergeConflictAsync_throws_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessFacade sut = CreateSut(runRepository: runs.Object);

        ResolveFindingMergeConflictRequest request = new()
        {
            Action = FindingMergeConflictResolutionAction.AcceptPrimary,
        };

        Func<Task> act = () => sut.TryResolveFindingMergeConflictAsync(
            foreignRunId,
            "conflict-finding",
            request,
            CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>()
            .WithMessage($"*'{foreignRunId:D}'*");
    }

    [Fact]
    public async Task ListDispositionsAsync_excludes_foreign_workspace_events_for_same_finding_id()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        FindingDispositionService dispositionService = new(
            Mock.Of<ArchLucid.Application.Governance.FindingReview.IFindingReviewTrailAppendService>(),
            CreateTrailRepositoryReturningForeignAndInScopeEvents(foreignWorkspaceId));

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            dispositionService: dispositionService);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListDispositionsAsync("finding-1", CancellationToken.None);

        history.Should().ContainSingle();
        history[0].ReviewerUserId.Should().Be("reviewer-in-scope");
    }

    [Fact]
    public async Task ListDispositionsAsync_returns_history_when_finding_id_differs_only_by_casing()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "find-abc",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "FIND-ABC" });

        Mock<ArchLucid.Persistence.Data.Repositories.IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(t => t.ListByFindingAsync(CallerScope.TenantId, "FIND-ABC", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    FindingId = "FIND-ABC",
                    ReviewerUserId = "reviewer-in-scope",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        FindingDispositionService dispositionService = new(
            Mock.Of<ArchLucid.Application.Governance.FindingReview.IFindingReviewTrailAppendService>(),
            trail.Object);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            dispositionService: dispositionService);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListDispositionsAsync("find-abc", CancellationToken.None);

        history.Should().ContainSingle();
        history[0].FindingId.Should().Be("FIND-ABC");
    }

    [Fact]
    public async Task GetRiskRegisterAsync_passes_caller_workspace_to_risk_register_service()
    {
        Guid? capturedWorkspaceId = null;

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<int>(),
                It.IsAny<ArchitectureRiskRegisterListOptions?>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Guid?, int, ArchitectureRiskRegisterListOptions?, CancellationToken>(
                (_, workspaceId, _, _, _, _) => capturedWorkspaceId = workspaceId)
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        GovernanceStickinessFacade sut = CreateSut(riskRegister: riskRegister.Object);

        await sut.GetRiskRegisterAsync(projectId: null, maxRows: 25, assignedToMe: false, CancellationToken.None);

        capturedWorkspaceId.Should().Be(CallerScope.WorkspaceId);
    }

    [Fact]
    public async Task ListRiskExceptionsAsync_excludes_foreign_workspace_active_waivers()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(service => service.ListActiveAsync(
                CallerScope.TenantId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    FindingId = "f-in-scope",
                    Status = RiskExceptionStatus.Active,
                },
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = foreignWorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    FindingId = "f-foreign",
                    Status = RiskExceptionStatus.Active,
                },
            ]);

        GovernanceStickinessFacade sut = CreateSut(riskExceptionService: riskExceptions.Object);

        IReadOnlyList<RiskExceptionRecord> records =
            await sut.ListRiskExceptionsAsync(projectId: null, CancellationToken.None);

        records.Should().ContainSingle();
        records[0].FindingId.Should().Be("f-in-scope");
    }

    [Fact]
    public async Task GetDecisionRegisterAsync_passes_caller_workspace_to_decision_register_service()
    {
        Guid? capturedWorkspaceId = null;

        Mock<IArchitectureDecisionRegisterService> decisions = new();
        decisions
            .Setup(service => service.GetRegisterAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<int>(),
                It.IsAny<ArchitectureDecisionRegisterQueryOptions>(),
                It.IsAny<CancellationToken>()))
            .Callback<Guid, Guid, Guid?, int, ArchitectureDecisionRegisterQueryOptions?, CancellationToken>(
                (_, workspaceId, _, _, _, _) => capturedWorkspaceId = workspaceId)
            .ReturnsAsync(new ArchitectureDecisionRegisterResponse());

        GovernanceStickinessFacade sut = CreateSut(decisionRegister: decisions.Object);

        await sut.GetDecisionRegisterAsync(
            projectId: null,
            maxRows: 25,
            new ArchitectureDecisionRegisterQueryOptions(),
            CancellationToken.None);

        capturedWorkspaceId.Should().Be(CallerScope.WorkspaceId);
    }

    [Fact]
    public async Task GetDecisionRegisterAsync_returns_empty_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureDecisionRegisterService> decisions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(decisionRegister: decisions.Object);

        ArchitectureDecisionRegisterResponse response = await sut.GetDecisionRegisterAsync(
            foreignProjectId,
            maxRows: 50,
            new ArchitectureDecisionRegisterQueryOptions(),
            CancellationToken.None);

        response.Decisions.Should().BeEmpty();
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetFindingsRegistersBundleAsync_returns_empty_when_project_id_is_out_of_scope()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IArchitectureRiskRegisterService> riskRegister = new(MockBehavior.Strict);
        Mock<IArchitectureDecisionRegisterService> decisions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            riskRegister: riskRegister.Object,
            decisionRegister: decisions.Object);

        GovernanceFindingsRegistersBundleResponse response =
            await sut.GetFindingsRegistersBundleAsync(foreignProjectId, maxRows: 50, CancellationToken.None);

        response.RiskRegister.Entries.Should().BeEmpty();
        response.DecisionRegister.Decisions.Should().BeEmpty();
        riskRegister.VerifyNoOtherCalls();
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_throws_when_finding_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "foreign-finding",
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Finding was not found*");

        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_persists_canonical_finding_id_when_request_differs_only_by_casing()
    {
        const string canonicalFindingId = "FIND-ABC";
        CreateRiskExceptionRequest? capturedRequest = null;

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "find-abc",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = canonicalFindingId,
            });

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<CreateRiskExceptionRequest, ScopeContext, string, CancellationToken>(
                (request, _, _, _) => capturedRequest = request)
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                TenantId = CallerScope.TenantId,
                WorkspaceId = CallerScope.WorkspaceId,
                ProjectId = CallerScope.ProjectId,
                FindingId = canonicalFindingId,
                OwnerUserId = "owner",
                Rationale = "accepted risk",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "find-abc",
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        await sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        capturedRequest.Should().NotBeNull();
        capturedRequest!.FindingId.Should().Be(canonicalFindingId);
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_throws_when_run_id_does_not_match_finding_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid otherInScopeRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
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
            .Setup(r => r.GetByIdAsync(CallerScope, otherInScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = otherInScopeRunId });

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            runRepository: runs.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = otherInScopeRunId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*authority run*");

        riskExceptions.VerifyNoOtherCalls();
        runs.Verify(
            r => r.GetByIdAsync(CallerScope, otherInScopeRunId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_throws_when_run_id_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            runRepository: runs.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = foreignRunId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>()
            .WithMessage($"*'{foreignRunId:D}'*");

        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_throws_when_manifest_id_does_not_belong_to_run()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid boundManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignManifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = runId,
                GoldenManifestId = boundManifestId,
            });

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            runRepository: runs.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            RunId = runId,
            ManifestId = foreignManifestId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>()
            .WithMessage($"*'{foreignManifestId:D}'*");

        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateRiskExceptionAsync_throws_when_manifest_id_provided_without_run_id()
    {
        Guid foreignManifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: findings.Object,
            riskExceptionService: riskExceptions.Object);

        CreateRiskExceptionRequest request = new()
        {
            FindingId = "finding-1",
            ManifestId = foreignManifestId,
            OwnerUserId = "owner",
            Rationale = "accepted risk",
            EvidenceRef = "evidence-1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateRiskExceptionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Run id is required when manifest id is specified*");

        riskExceptions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RevokeRiskExceptionAsync_throws_when_exception_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid exceptionId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(s => s.GetByIdAsync(CallerScope.TenantId, exceptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RiskExceptionRecord
            {
                RiskExceptionId = exceptionId,
                TenantId = CallerScope.TenantId,
                WorkspaceId = foreignWorkspaceId,
                ProjectId = CallerScope.ProjectId,
                FindingId = "finding-1",
                OwnerUserId = "owner",
                Rationale = "rationale",
                Status = RiskExceptionStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedByUserId = "creator",
            });

        GovernanceStickinessFacade sut = CreateSut(riskExceptionService: riskExceptions.Object);

        Func<Task> act = () => sut.RevokeRiskExceptionAsync(exceptionId, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");

        riskExceptions.Verify(
            s => s.RevokeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_throws_when_source_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Persistence.Models.RunRecord?)null);

        GovernanceStickinessFacade sut = CreateSut(runRepository: runs.Object);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = foreignRunId,
            IsEnabled = true,
            CronExpression = "0 8 * * 1",
        };

        Func<Task> act = () => sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>()
            .WithMessage($"*'{foreignRunId:D}'*");
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_throws_when_source_run_is_not_committed()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
                GoldenManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            });

        GovernanceStickinessFacade sut = CreateSut(runRepository: runs.Object);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            IsEnabled = true,
            CronExpression = "0 8 * * 1",
        };

        Func<Task> act = () => sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        await act.Should()
            .ThrowAsync<ArgumentException>()
            .WithMessage("*committed*");
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_returns_existing_schedule_when_identical_operator_retry()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid existingScheduleId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        const string cronExpression = "0 8 * * 1";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new ArchitectureReviewRecurrenceSchedule
                {
                    ScheduleId = existingScheduleId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    SourceRunId = sourceRunId,
                    Name = "Recurring architecture review",
                    CronExpression = cronExpression,
                    IsEnabled = true,
                },
            ]);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        calculator
            .Setup(c => c.IsSupportedCronExpression(cronExpression))
            .Returns(true);
        calculator
            .Setup(c => c.ComputeNextRunUtc(cronExpression, It.IsAny<DateTime>(), true))
            .Returns(DateTime.UtcNow.AddDays(7));

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            recurrenceRepository: recurrenceRepo.Object,
            recurrenceCalculator: calculator.Object,
            auditService: audit.Object,
            authorityQuery: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(CallerScope),
            manifestHashService: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService());

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            IsEnabled = true,
            CronExpression = cronExpression,
        };

        ArchitectureReviewRecurrenceSchedule first =
            await sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);
        ArchitectureReviewRecurrenceSchedule second =
            await sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        second.ScheduleId.Should().Be(first.ScheduleId);
        second.ScheduleId.Should().Be(existingScheduleId);
        recurrenceRepo.Verify(
            r => r.CreateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_returns_existing_schedule_when_name_differs_only_by_casing()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid existingScheduleId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        const string cronExpression = "0 8 * * 1";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new ArchitectureReviewRecurrenceSchedule
                {
                    ScheduleId = existingScheduleId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    SourceRunId = sourceRunId,
                    Name = "Recurring architecture review",
                    CronExpression = cronExpression,
                    IsEnabled = true,
                },
            ]);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        calculator
            .Setup(c => c.IsSupportedCronExpression(cronExpression))
            .Returns(true);
        calculator
            .Setup(c => c.ComputeNextRunUtc(cronExpression, It.IsAny<DateTime>(), true))
            .Returns(DateTime.UtcNow.AddDays(7));

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            recurrenceRepository: recurrenceRepo.Object,
            recurrenceCalculator: calculator.Object,
            auditService: audit.Object,
            authorityQuery: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(CallerScope),
            manifestHashService: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService());

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            IsEnabled = true,
            CronExpression = cronExpression,
            Name = "recurring architecture review",
        };

        ArchitectureReviewRecurrenceSchedule schedule =
            await sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        schedule.ScheduleId.Should().Be(existingScheduleId);
        recurrenceRepo.Verify(
            r => r.CreateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_returns_existing_schedule_when_cron_differs_only_by_casing()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid existingScheduleId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        const string storedCron = "0 8 * * MON";
        const string requestCron = "0 8 * * mon";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        Mock<IArchitectureReviewRecurrenceScheduleRepository> recurrenceRepo = new();
        recurrenceRepo
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new ArchitectureReviewRecurrenceSchedule
                {
                    ScheduleId = existingScheduleId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    SourceRunId = sourceRunId,
                    Name = "Recurring architecture review",
                    CronExpression = storedCron,
                    IsEnabled = true,
                },
            ]);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureReviewRecurrenceNextRunCalculator realCalculator = new(new SimpleScanScheduleCalculator());
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        calculator
            .Setup(c => c.IsSupportedCronExpression(It.IsAny<string>()))
            .Returns((string cron) => realCalculator.IsSupportedCronExpression(cron));
        calculator
            .Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<bool>()))
            .Returns((string cron, DateTime from, bool enabled) => realCalculator.ComputeNextRunUtc(cron, from, enabled));

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            recurrenceRepository: recurrenceRepo.Object,
            recurrenceCalculator: calculator.Object,
            auditService: audit.Object,
            authorityQuery: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(CallerScope),
            manifestHashService: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService());

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            IsEnabled = true,
            CronExpression = requestCron,
            Name = "Recurring architecture review",
        };

        ArchitectureReviewRecurrenceSchedule schedule =
            await sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        schedule.ScheduleId.Should().Be(existingScheduleId);
        recurrenceRepo.Verify(
            r => r.CreateAsync(It.IsAny<ArchitectureReviewRecurrenceSchedule>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRecurrenceScheduleAsync_throws_when_name_exceeds_sql_max_length()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        ArchitectureReviewRecurrenceNextRunCalculator realCalculator =
            new(new ArchLucid.Decisioning.Advisory.Scheduling.SimpleScanScheduleCalculator());
        Mock<IArchitectureReviewRecurrenceNextRunCalculator> calculator = new();
        calculator
            .Setup(c => c.IsSupportedCronExpression(It.IsAny<string>()))
            .Returns((string cron) => realCalculator.IsSupportedCronExpression(cron));
        calculator
            .Setup(c => c.ComputeNextRunUtc(It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<bool>()))
            .Returns((string cron, DateTime from, bool enabled) => realCalculator.ComputeNextRunUtc(cron, from, enabled));

        GovernanceStickinessFacade sut = CreateSut(
            runRepository: runs.Object,
            recurrenceCalculator: calculator.Object);

        CreateArchitectureReviewRecurrenceScheduleRequest request = new()
        {
            SourceRunId = sourceRunId,
            Name = new string('n', RecurrenceScheduleValidation.NameMaxLength + 1),
            IsEnabled = true,
            CronExpression = "0 8 * * 1",
        };

        Func<Task> act = () => sut.CreateRecurrenceScheduleAsync(request, CancellationToken.None);

        await act.Should()
            .ThrowAsync<ArgumentException>()
            .WithMessage($"*at most {RecurrenceScheduleValidation.NameMaxLength}*");
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_throws_when_all_finding_ids_are_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        GovernanceStickinessFacade sut = CreateSut(findingInspect: inspect.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["foreign-finding-1", "foreign-finding-2"],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        Func<Task> act = () => sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Finding was not found*");
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_throws_when_any_finding_id_is_out_of_scope()
    {
        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "in-scope-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "in-scope-finding" });
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        Mock<IFindingDispositionService> disposition = new();
        disposition
            .Setup(s => s.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(r => r.FindingId == "in-scope-finding"),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = "in-scope-finding" });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: inspect.Object,
            dispositionService: disposition.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = ["in-scope-finding", "foreign-finding"],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        Func<Task> act = () => sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Finding was not found*");

        disposition.Verify(
            s => s.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_records_each_distinct_finding_id_once_when_list_contains_duplicates()
    {
        const string findingId = "finding-bulk-dup";

        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request => request.FindingId == findingId),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: inspect.Object,
            dispositionService: dispositions.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId, findingId, "FINDING-BULK-DUP"],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "bulk",
        };

        RecordBulkFindingDispositionResponse response =
            await sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        response.ProcessedCount.Should().Be(1);
        response.UpdatedFindingIds.Should().Equal(findingId);
        dispositions.Verify(
            d => d.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_forwards_trade_off_acknowledgment_for_accepted_disposition()
    {
        const string findingId = "finding-bulk-accept";
        const string rationale = "accepted after architecture board review";

        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == findingId
                    && request.TradeOffAcknowledgment == rationale),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: inspect.Object,
            dispositionService: dispositions.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = rationale,
        };

        RecordBulkFindingDispositionResponse response =
            await sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        response.ProcessedCount.Should().Be(1);
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_forwards_evidence_request_text_for_needs_evidence_disposition()
    {
        const string findingId = "finding-bulk-needs-evidence";
        const string evidenceRequestText = "Provide threat model appendix.";

        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = findingId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == findingId
                    && request.EvidenceRequestText == evidenceRequestText),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: inspect.Object,
            dispositionService: dispositions.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence,
            Rationale = "awaiting evidence",
            EvidenceRequestText = evidenceRequestText,
        };

        RecordBulkFindingDispositionResponse response =
            await sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        response.ProcessedCount.Should().Be(1);
    }

    [Fact]
    public async Task RecordBulkDispositionAsync_binds_authority_run_id_from_finding_inspect()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        const string findingId = "finding-bulk-authority-run";

        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(r => r.GetInspectAsync(
                CallerScope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = findingId,
                RunId = authorityRunId,
            });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, authorityRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Persistence.Models.RunRecord { RunId = authorityRunId });

        Mock<IFindingDispositionService> dispositions = new();
        dispositions
            .Setup(d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(request =>
                    request.FindingId == findingId
                    && request.RunId == authorityRunId),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingDispositionEventDto { FindingId = findingId });

        GovernanceStickinessFacade sut = CreateSut(
            findingInspect: inspect.Object,
            runRepository: runs.Object,
            dispositionService: dispositions.Object);

        RecordBulkFindingDispositionRequest request = new()
        {
            FindingIds = [findingId],
            Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
            Rationale = "bulk with authority run binding",
        };

        RecordBulkFindingDispositionResponse response =
            await sut.RecordBulkDispositionAsync(request, CancellationToken.None);

        response.ProcessedCount.Should().Be(1);
        dispositions.Verify(
            d => d.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(r => r.RunId == authorityRunId),
                CallerScope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static GovernanceStickinessFacade CreateSut(
        IArchitectureRiskRegisterService? riskRegister = null,
        IFindingInspectReadRepository? findingInspect = null,
        IFindingDispositionService? dispositionService = null,
        IArchitectureDecisionRegisterService? decisionRegister = null,
        IRiskExceptionService? riskExceptionService = null,
        IRunRepository? runRepository = null,
        ArchLucid.Application.Findings.IFindingMergeConflictResolutionService? mergeConflictResolution = null,
        IActorContext? actor = null,
        IArchitectureReviewRecurrenceNextRunCalculator? recurrenceCalculator = null,
        IAuditService? auditService = null,
        IAuthorityQueryService? authorityQuery = null,
        IManifestHashService? manifestHashService = null,
        IArchitectureReviewRecurrenceScheduleRepository? recurrenceRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new GovernanceStickinessFacade(
            scope.Object,
            actor ?? Mock.Of<IActorContext>(),
            dispositionService ?? new Mock<IFindingDispositionService>().Object,
            riskExceptionService ?? Mock.Of<IRiskExceptionService>(),
            riskRegister ?? new Mock<IArchitectureRiskRegisterService>().Object,
            decisionRegister ?? new Mock<IArchitectureDecisionRegisterService>().Object,
            recurrenceRepository ?? Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            recurrenceCalculator ?? Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            mergeConflictResolution ?? Mock.Of<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IRealizedValueAttestationService>(),
            auditService ?? Mock.Of<IAuditService>(),
            findingInspect ?? Mock.Of<IFindingInspectReadRepository>(),
            authorityQuery ?? Mock.Of<IAuthorityQueryService>(),
            manifestHashService ?? Mock.Of<IManifestHashService>());
    }

    private static ArchLucid.Persistence.Data.Repositories.IFindingReviewTrailRepository CreateTrailRepositoryReturningForeignAndInScopeEvents(
        Guid foreignWorkspaceId)
    {
        Mock<ArchLucid.Persistence.Data.Repositories.IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(t => t.ListByFindingAsync(CallerScope.TenantId, "finding-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = foreignWorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    FindingId = "finding-1",
                    ReviewerUserId = "reviewer-foreign",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    FindingId = "finding-1",
                    ReviewerUserId = "reviewer-in-scope",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Accepted,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        return trail.Object;
    }
}
