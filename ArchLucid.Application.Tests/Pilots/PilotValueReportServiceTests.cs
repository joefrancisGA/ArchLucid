using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotValueReportServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private const string RunA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string RunB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    private const string RunIn = "dddddddddddddddddddddddddddddddd";
    private const string RunOld = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

    [SkippableFact]
    public async Task BuildAsync_returns_null_when_tenant_missing()
    {
        PilotValueReportService sut = CreateSut(
            tenant: null,
            runs: Mock.Of<IRunDetailQueryService>(),
            audit: Mock.Of<IAuditRepository>(),
            approvals: Mock.Of<IGovernanceApprovalRequestRepository>());

        PilotValueReport? r = await sut.BuildAsync(null, null, CancellationToken.None);

        r.Should().BeNull();
    }

    [SkippableFact]
    public async Task BuildAsync_empty_window_returns_zeros()
    {
        DateTime anchor = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(anchor);

        PilotValueReportService sut = CreateSut(
            tenant,
            runs: Mock.Of<IRunDetailQueryService>(),
            audit: Mock.Of<IAuditRepository>(),
            approvals: ApprovalsPending(0).Object);

        PilotValueReport? r = await sut.BuildAsync(anchor.AddHours(2), anchor.AddHours(1), CancellationToken.None);

        r.Should().NotBeNull();
        r.TotalRunsCommitted.Should().Be(0);
        r.TotalFindings.Should().Be(0);
        r.GovernancePendingApprovalsNow.Should().Be(0);
    }

    [SkippableFact]
    public async Task BuildAsync_null_from_clamps_default_window_to_max_days()
    {
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        DateTime tenantCreated = to.AddYears(-2);
        DateTime expectedFrom = to.AddDays(-PilotValueReportService.DefaultReportWindowMaxDays);
        TenantRecord tenant = Tenant(new DateTimeOffset(tenantCreated, TimeSpan.Zero));

        Mock<IRunDetailQueryService> runs = new();
        runs.Setup(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], false, null));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                expectedFrom,
                to,
                PilotValueReportService.AuditExportMaxRows,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(0).Object);

        PilotValueReport? report = await sut.BuildAsync(null, to, CancellationToken.None);

        report.Should().NotBeNull();
        report!.FromUtc.Should().Be(expectedFrom);
        report.ToUtc.Should().Be(to);
        audit.VerifyAll();
    }

    [SkippableFact]
    public async Task BuildAsync_collect_committed_runs_stops_at_keyset_max_page_cap()
    {
        DateTime from = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(new DateTimeOffset(from, TimeSpan.Zero));

        RunSummary inRange = Summary(RunA, from.AddDays(1), committed: true);

        Mock<IRunDetailQueryService> runs = new();
        runs.Setup(r => r.ListRunSummariesKeysetAsync(It.IsAny<string?>(), 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([inRange], true, "next"));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Detail(RunA, from.AddDays(1), from.AddDays(1).AddMinutes(30), findings: []));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(0).Object);

        PilotValueReport? report = await sut.BuildAsync(from, to, CancellationToken.None);

        report.Should().NotBeNull();
        runs.Verify(
            r => r.ListRunSummariesKeysetAsync(It.IsAny<string?>(), 100, It.IsAny<CancellationToken>()),
            Times.Exactly(2_000));
    }

    [SkippableFact]
    public async Task BuildAsync_ReadyForCommitRunWithManifest_IsNotCountedAsCommitted()
    {
        DateTime from = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        RunSummary readyForCommit = new()
        {
            RunId = RunA,
            RequestId = "req-ready",
            Status = nameof(ArchitectureRunStatus.ReadyForCommit),
            CreatedUtc = from.AddDays(1),
            CompletedUtc = from.AddDays(1),
            CurrentManifestVersion = "v1",
            SystemName = "sys",
        };
        RunSummary committed = Summary(RunB, from.AddDays(2), committed: true);

        Mock<IRunDetailQueryService> runs = new();
        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([readyForCommit, committed], false, null));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Detail(RunB, from.AddDays(2), from.AddDays(2).AddMinutes(30), findings: []));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(0).Object);

        PilotValueReport? report = await sut.BuildAsync(from, to, CancellationToken.None);

        report.Should().NotBeNull();
        report.TotalRunsCommitted.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildAsync_excludes_muted_findings_from_severity_totals()
    {
        DateTime from = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        Mock<IRunDetailQueryService> runs = new();
        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([Summary(RunA, from.AddDays(1), committed: true)], false, null));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                Detail(
                    RunA,
                    from.AddDays(1),
                    from.AddDays(1).AddMinutes(30),
                    findings:
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            SourceAgent = AgentType.Topology,
                            Message = "muted",
                            IsMuted = true,
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Warning,
                            SourceAgent = AgentType.Compliance,
                            Message = "active",
                        },
                    ]));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(0).Object);

        PilotValueReport? report = await sut.BuildAsync(from, to, CancellationToken.None);

        report.Should().NotBeNull();
        report!.TotalFindings.Should().Be(1);
        report.FindingsBySeverity.Critical.Should().Be(0);
        report.FindingsBySeverity.Medium.Should().Be(1);
    }

    [SkippableFact]
    public async Task BuildAsync_counts_committed_runs_in_range_and_aggregates_findings()
    {
        DateTime from = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        Mock<IRunDetailQueryService> runs = new();
        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (
                    (IReadOnlyList<RunSummary>)
                    [
                        Summary(RunA, from.AddDays(1), committed: true),
                        Summary(RunB, from.AddDays(2), committed: true)
                    ],
                    true,
                    "c1"));

        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync("c1", 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], false, null));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Detail(RunA, from.AddDays(1), committedUtc: from.AddDays(1).AddMinutes(30), findings: []));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                DetailTwoAgents(
                    RunB,
                    from.AddDays(2),
                    committedUtc: from.AddDays(2).AddHours(1),
                    new ArchitectureFinding { Severity = FindingSeverity.Critical, SourceAgent = AgentType.Topology, Message = "x" },
                    new ArchitectureFinding { Severity = FindingSeverity.Warning, SourceAgent = AgentType.Compliance, Message = "y" }));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new List<AuditEvent>
                {
                    new()
                    {
                        EventType = AuditEventTypes.RecommendationGenerated,
                        OccurredUtc = from.AddHours(1),
                        TenantId = Scope.TenantId,
                        WorkspaceId = Scope.WorkspaceId,
                        ProjectId = Scope.ProjectId,
                        ActorUserId = "u",
                        ActorUserName = "n"
                    },
                    new()
                    {
                        EventType = AuditEventTypes.GovernanceApprovalApproved,
                        OccurredUtc = from.AddHours(2),
                        TenantId = Scope.TenantId,
                        WorkspaceId = Scope.WorkspaceId,
                        ProjectId = Scope.ProjectId,
                        ActorUserId = "u",
                        ActorUserName = "n"
                    }
                });

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(3).Object);

        PilotValueReport? r = await sut.BuildAsync(from, to, CancellationToken.None);

        r.Should().NotBeNull();
        r.TotalRunsCommitted.Should().Be(2);
        r.TotalFindings.Should().Be(2);
        r.FindingsBySeverity.Critical.Should().Be(1);
        r.FindingsBySeverity.Medium.Should().Be(1);
        r.TotalRecommendationsProduced.Should().Be(1);
        r.GovernanceApprovals.Should().Be(1);
        r.GovernancePendingApprovalsNow.Should().Be(3);
        r.UniqueAgentTypes.Should().Contain([nameof(AgentType.Topology), nameof(AgentType.Compliance)]);
        r.AveragePipelineCompletionSeconds.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task BuildAsync_stops_paging_when_run_created_before_from()
    {
        DateTime from = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(TimeProvider.System.GetUtcNow());

        RunSummary old = Summary(RunOld, from.AddDays(-10), committed: true);
        RunSummary inside = Summary(RunIn, from.AddDays(1), committed: true);

        Mock<IRunDetailQueryService> runs = new();
        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([inside, old], false, null));

        runs.Setup(r => r.GetRunDetailForRoiAsync(RunIn, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Detail(RunIn, inside.CreatedUtc, inside.CreatedUtc.AddMinutes(5), []));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, ApprovalsPending(0).Object);

        PilotValueReport? r = await sut.BuildAsync(from, to, CancellationToken.None);

        r.Should().NotBeNull();
        r.TotalRunsCommitted.Should().Be(1);
        runs.Verify(x => x.GetRunDetailForRoiAsync(RunOld, It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_uses_uncapped_pending_count_not_dashboard_list_cap()
    {
        DateTime from = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc);
        TenantRecord tenant = Tenant(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        Mock<IRunDetailQueryService> runs = new();
        runs.SetupSequence(r => r.ListRunSummariesKeysetAsync(null, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], false, null));

        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.GetExportAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, from, to, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IGovernanceApprovalRequestRepository> approvals = ApprovalsPending(75);

        PilotValueReportService sut = CreateSut(tenant, runs.Object, audit.Object, approvals.Object);

        PilotValueReport? report = await sut.BuildAsync(from, to, CancellationToken.None);

        report.Should().NotBeNull();
        report.GovernancePendingApprovalsNow.Should().Be(75);
        approvals.Verify(a => a.CountPendingApprovalsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static TenantRecord Tenant(DateTimeOffset created) =>
        new()
        {
            Id = Scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = created,
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0
        };

    private static Mock<IGovernanceApprovalRequestRepository> ApprovalsPending(long pending)
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(a => a.CountPendingApprovalsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);

        return approvals;
    }

    private static RunSummary Summary(string runId, DateTime created, bool committed) =>
        new()
        {
            RunId = runId,
            RequestId = "req",
            Status = committed ? nameof(ArchitectureRunStatus.Committed) : nameof(ArchitectureRunStatus.Created),
            CreatedUtc = created,
            CompletedUtc = committed ? created : null,
            CurrentManifestVersion = committed ? "v1" : null,
            SystemName = "sys"
        };

    private static ArchitectureRunDetail Detail(
        string runId,
        DateTime createdUtc,
        DateTime committedUtc,
        IReadOnlyList<ArchitectureFinding> findings)
    {
        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun { RunId = runId, CreatedUtc = createdUtc, Status = ArchitectureRunStatus.Committed },
            Results =
            [
                new AgentResult { RunId = runId, TaskId = "task", AgentType = AgentType.Topology, Findings = findings.ToList() }
            ],
            Manifest = new GoldenManifest { RunId = runId, SystemName = "sys", Metadata = new ManifestMetadata { CreatedUtc = committedUtc } }
        };
    }

    private static ArchitectureRunDetail DetailTwoAgents(
        string runId,
        DateTime createdUtc,
        DateTime committedUtc,
        ArchitectureFinding topologyFinding,
        ArchitectureFinding complianceFinding)
    {
        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun { RunId = runId, CreatedUtc = createdUtc, Status = ArchitectureRunStatus.Committed },
            Results =
            [
                new AgentResult { RunId = runId, TaskId = "task-t", AgentType = AgentType.Topology, Findings = [topologyFinding] },
                new AgentResult { RunId = runId, TaskId = "task-c", AgentType = AgentType.Compliance, Findings = [complianceFinding] }
            ],
            Manifest = new GoldenManifest { RunId = runId, SystemName = "sys", Metadata = new ManifestMetadata { CreatedUtc = committedUtc } }
        };
    }

    private static PilotValueReportService CreateSut(
        TenantRecord? tenant,
        IRunDetailQueryService runs,
        IAuditRepository audit,
        IGovernanceApprovalRequestRepository approvals)
    {
        Mock<ITenantRepository> tenants = new();

        if (tenant is null)
            tenants.Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync((TenantRecord?)null);
        else
            tenants.Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new PilotValueReportService(
            runs,
            audit,
            tenants.Object,
            scope.Object,
            approvals,
            NullLogger<PilotValueReportService>.Instance);
    }
}
