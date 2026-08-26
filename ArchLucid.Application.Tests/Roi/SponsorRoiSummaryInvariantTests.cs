using ArchLucid.Application.Governance;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

/// <summary>Regression guards for sponsor ROI / reports sponsor-facing KPI semantics (TB-240).</summary>
[Trait("Suite", "Core")]
public sealed class SponsorRoiSummaryInvariantTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task SponsorReportResult_maps_resolved_findings_separately_from_pending_governance()
    {
        // Regression guard for TB-151 — TotalRiskReductionScore must not alias pending decision count.
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<ISponsorRoiSummaryService> roi = new();
        roi.Setup(service => service.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new SponsorRoiSummaryResponse
            {
                ResolvedFindingsCount30Days = 4,
                NewlyDiscoveredFindingsCount30Days = 0,
                LatestRunCount = 2,
                TopSystemicIssues = [],
            });

        Mock<IGovernanceDigestDecisionNeededComposer> decisions = new();
        decisions
            .Setup(composer => composer.BuildSummaryAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceDecisionsNeededSummaryResponse { TotalDecisionItems = 20 });

        SponsorReportsSummaryService sut = new(scope.Object, roi.Object, decisions.Object);

        SponsorReportResult result = await sut.BuildAsync(CancellationToken.None);

        result.TotalRiskReductionScore.Should().Be(4);
        result.PendingGovernanceDecisionCount.Should().Be(20);
    }

    [Fact]
    public async Task SponsorReportResult_cost_waste_usd_is_not_aliased_to_total_savings()
    {
        // Regression guard for TB-152 — CostWasteUsd must stay null until a distinct waste metric exists.
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<ISponsorRoiSummaryService> roi = new();
        roi.Setup(service => service.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new SponsorRoiSummaryResponse
            {
                TotalEstimatedUsdSavings = 50_000m,
                ResolvedFindingsCount30Days = 1,
                LatestRunCount = 1,
                TopSystemicIssues = [],
            });

        Mock<IGovernanceDigestDecisionNeededComposer> decisions = new();
        decisions
            .Setup(composer => composer.BuildSummaryAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceDecisionsNeededSummaryResponse());

        SponsorReportsSummaryService sut = new(scope.Object, roi.Object, decisions.Object);

        SponsorReportResult result = await sut.BuildAsync(CancellationToken.None);

        result.TotalCostSavingsUsd.Should().Be(50_000m);
        result.CostWasteUsd.Should().BeNull();
    }

    [Fact]
    public async Task Trailing_30d_metrics_do_not_count_fewer_findings_as_newly_discovered_when_only_resolved()
    {
        // Regression guard for TB-151/TB-152 polarity — improvement (fewer active findings) must not inflate discovery counts.
        DateTime committedUtc = TimeProvider.System.UtcNowDateTime().AddDays(-2);
        Guid runId = Guid.Parse("dddddddddddddddddddddddddddddddd");

        RunSummary summary = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v2",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { summary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetailWithFindings(runId, committedUtc, [
                new ArchitectureFinding
                {
                    FindingId = "finding-improved",
                    Category = "Security",
                    Severity = FindingSeverity.Warning,
                    Message = "single remaining",
                },
            ]));

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    FindingId = "finding-improved",
                    Action = FindingReviewAction.Approve,
                    Disposition = FindingDisposition.Accepted,
                    OccurredAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                },
            ]);

        (SponsorRoiSummaryService service, _) = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            findingReviewTrailRepository: trail.Object,
            scope: new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        SponsorRoiSummaryResponse response = await service.BuildAsync(CancellationToken.None);

        response.ResolvedFindingsCount30Days.Should().BeGreaterThan(0);
        response.NewlyDiscoveredFindingsCount30Days.Should().Be(1);
    }

    [Fact]
    public async Task Expiring_waiver_count_matches_between_roi_summary_and_decisions_needed()
    {
        // Regression guard for TB-149 — both surfaces must use the same 14-day UTC window calculator.
        DateTimeOffset nowUtc = DateTimeOffset.UtcNow;
        RiskExceptionRecord expiringSoon = new()
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = TenantId,
            ProjectId = ProjectId,
            ExpiresAtUtc = nowUtc.AddDays(10),
            Status = RiskExceptionStatus.Active,
        };

        RiskExceptionRecord expiringLater = new()
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = TenantId,
            ProjectId = ProjectId,
            ExpiresAtUtc = nowUtc.AddDays(30),
            Status = RiskExceptionStatus.Active,
        };

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(service => service.ListActiveAsync(TenantId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([expiringSoon, expiringLater]);

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, null));

        (SponsorRoiSummaryService innerService, _) = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scope: new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<IHotPathReadCache> cache = new();
        cache
            .Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, Task<SponsorRoiSummaryResponse?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse { ExpiringWaiversCount14Days = 99 });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<IOptionsMonitor<SponsorRoiCacheWarmupOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new SponsorRoiCacheWarmupOptions { CacheTtlSeconds = 300 });

        Mock<IArchitectureRiskRegisterService> architectureRiskRegister = new();
        architectureRiskRegister
            .Setup(service => service.GetRegisterAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        CachingSponsorRoiSummaryService cachedRoi = new(
            innerService,
            riskExceptions.Object,
            architectureRiskRegister.Object,
            cache.Object,
            scopeProvider.Object,
            options.Object);

        SponsorRoiSummaryResponse roi = await cachedRoi.BuildAsync(CancellationToken.None);

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> register = new();
        register
            .Setup(service => service.GetRegisterAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(TenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            register.Object,
            riskExceptions.Object,
            trail.Object,
            Mock.Of<IArchitectureDigestRepository>(),
            cachedRoi);

        GovernanceDecisionsNeededSummaryResponse decisions =
            await composer.BuildSummaryAsync(TenantId, WorkspaceId, ProjectId, CancellationToken.None);

        roi.ExpiringWaiversCount14Days.Should().Be(1);
        decisions.WaiversExpiringWithin14Days.Should().Be(1);
        roi.ExpiringWaiversCount14Days.Should().Be(decisions.WaiversExpiringWithin14Days);
    }

    [Fact]
    public void ComputeHeadlineSavingsFromBasis_uses_open_plus_needs_evidence_only()
    {
        SponsorRoiBasisBreakdown basis = new()
        {
            OpenEstimatedUsd = 100m,
            NeedsEvidenceUsd = 25m,
            AcceptedRiskUsd = 50m,
            DeferredUsd = 10m,
            WaivedUsd = 5m,
            RealizedUsd = 200m,
        };

        SponsorRoiSummaryService.ComputeHeadlineSavingsFromBasis(basis).Should().Be(125m);
    }

    [Fact]
    public async Task BuildAsync_headline_matches_basis_open_plus_needs_evidence()
    {
        DateTime committedUtc = TimeProvider.System.UtcNowDateTime().AddDays(-1);
        Guid runId = Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        Guid snapshotId = Guid.Parse("ffffffffffffffffffffffffffffffff");

        RunSummary summary = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = committedUtc,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { summary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetailWithFindings(runId, committedUtc, []));

        ArchitectureRunDetail detail = BuildDetailWithFindings(runId, committedUtc, []);
        detail.Run.FindingsSnapshotId = snapshotId;

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        SponsorRoiSummaryService service = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scope: new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId },
            configureFindingsSnapshots: mock =>
            {
                mock
                    .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(SponsorRoiSummaryServiceTestSupport.CreateOpenFindingSnapshot(900m));
            }).Service;

        SponsorRoiSummaryResponse response = await service.BuildAsync(CancellationToken.None);

        decimal expectedHeadline = response.BasisBreakdown is null
            ? 0m
            : SponsorRoiSummaryService.ComputeHeadlineSavingsFromBasis(response.BasisBreakdown);

        response.TotalEstimatedUsdSavings.Should().Be(expectedHeadline);
    }

    [Fact]
    public void Orphan_candidate_count_uses_single_pipeline_not_double_markers()
    {
        // Regression guard for TB-103 — structured + legacy orphan markers on one finding must count once.
        ArchitectureFinding dualMarked = new()
        {
            FindingId = "orph-dual",
            Category = "CostOptimization",
            Message = "Orphaned resource: Microsoft.Compute/disks",
            EstimatedUsdSavings = 200m,
            EvidenceRefs =
            [
                "finding-type:OrphanedAzureResource",
                "engine:orphaned-azure-resource",
            ],
        };

        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-dual", CompletedUtc = DateTime.UtcNow },
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { CreatedUtc = DateTime.UtcNow } },
            Results =
            [
                new AgentResult
                {
                    RunId = "run-dual",
                    TaskId = "task-1",
                    AgentType = AgentType.Cost,
                    Findings = [dualMarked, dualMarked],
                },
            ],
        };

        SponsorOrphanCandidateSummary summary =
            SponsorOrphanCandidateKpiCalculator.BuildFromLatestDetails([detail]);

        summary.CandidateCount.Should().Be(1);
        summary.AnnualSavingsUsd.Should().Be(200m);
    }

    [Fact]
    public async Task Cached_roi_summary_refreshes_expiring_waiver_count_after_stale_cache_entry()
    {
        // Regression guard for TB-155 — governance waiver KPIs must not serve stale cached values.
        DateTimeOffset nowUtc = DateTimeOffset.UtcNow;
        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(service => service.ListActiveAsync(TenantId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = TenantId,
                    ProjectId = ProjectId,
                    ExpiresAtUtc = nowUtc.AddDays(5),
                    Status = RiskExceptionStatus.Active,
                },
            ]);

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, null));

        (SponsorRoiSummaryService innerService, _) = SponsorRoiSummaryServiceTestSupport.CreateService(
            runQuery.Object,
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scope: new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<IHotPathReadCache> cache = new();
        cache
            .Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, Task<SponsorRoiSummaryResponse?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse { ExpiringWaiversCount14Days = 0 });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<IOptionsMonitor<SponsorRoiCacheWarmupOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new SponsorRoiCacheWarmupOptions { CacheTtlSeconds = 300 });

        Mock<IArchitectureRiskRegisterService> architectureRiskRegisterForCache = new();
        architectureRiskRegisterForCache
            .Setup(service => service.GetRegisterAsync(TenantId, WorkspaceId, ProjectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        CachingSponsorRoiSummaryService sut = new(
            innerService,
            riskExceptions.Object,
            architectureRiskRegisterForCache.Object,
            cache.Object,
            scopeProvider.Object,
            options.Object);

        SponsorRoiSummaryResponse result = await sut.BuildAsync(CancellationToken.None);

        result.ExpiringWaiversCount14Days.Should().Be(1);
    }

    private static ArchitectureRunDetail BuildDetailWithFindings(
        Guid runId,
        DateTime committedUtc,
        IReadOnlyList<ArchitectureFinding> findings)
    {
        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = runId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
                CompletedUtc = committedUtc,
            },
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { CreatedUtc = committedUtc } },
            Results =
            [
                new AgentResult
                {
                    RunId = runId.ToString("N"),
                    TaskId = "task-1",
                    AgentType = AgentType.Topology,
                    Findings = findings.ToList(),
                },
            ],
        };
    }
}
