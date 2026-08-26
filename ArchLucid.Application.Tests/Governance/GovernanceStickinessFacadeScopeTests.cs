using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
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

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*not found in the current scope*");
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

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*None of the provided findings were found in the current scope*");
    }

    private static GovernanceStickinessFacade CreateSut(
        IArchitectureRiskRegisterService? riskRegister = null,
        IFindingInspectReadRepository? findingInspect = null,
        IFindingDispositionService? dispositionService = null,
        IArchitectureDecisionRegisterService? decisionRegister = null,
        IRiskExceptionService? riskExceptionService = null,
        IRunRepository? runRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new GovernanceStickinessFacade(
            scope.Object,
            Mock.Of<IActorContext>(),
            dispositionService ?? new Mock<IFindingDispositionService>().Object,
            riskExceptionService ?? Mock.Of<IRiskExceptionService>(),
            riskRegister ?? new Mock<IArchitectureRiskRegisterService>().Object,
            decisionRegister ?? new Mock<IArchitectureDecisionRegisterService>().Object,
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            Mock.Of<ArchLucid.Application.Findings.IFindingMergeConflictResolutionService>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IRealizedValueAttestationService>(),
            Mock.Of<IAuditService>(),
            findingInspect ?? Mock.Of<IFindingInspectReadRepository>());
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
