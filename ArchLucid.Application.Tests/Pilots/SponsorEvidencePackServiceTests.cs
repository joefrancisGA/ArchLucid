using ArchLucid.Application.Tests.Roi;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class SponsorEvidencePackServiceTests
{
    [SkippableFact]
    public async Task BuildAsync_when_demo_run_missing_exposes_null_deltas_and_zero_findings_completeness()
    {
        WhyArchLucidSnapshotResponse snap = new()
        {
            GeneratedUtc = new DateTimeOffset(2026, 4, 28, 0, 0, 0, TimeSpan.Zero),
            DemoRunId = ContosoRetailDemoIdentifiers.RunBaseline,
            RunsCreatedTotal = 3,
        };

        Mock<IWhyArchLucidSnapshotService> snapshot = new();
        snapshot.Setup(s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(snap);

        Mock<IRunDetailQueryService> runs = new();
        runs.Setup(r => r.GetRunDetailAsync(ContosoRetailDemoIdentifiers.RunBaseline, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Mock<IPilotRunDeltaComputer> deltas = new();
        Mock<IFindingsSnapshotRepository> findingsRepo = new();

        GovernanceDashboardSummary dash = new() { PendingCount = 0, RecentDecisions = [], RecentChanges = [], };

        Mock<IGovernanceDashboardService> gov = new();
        gov.Setup(g =>
                g.GetDashboardAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(dash);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(sp => sp.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = ScopeIds.DefaultTenant, WorkspaceId = ScopeIds.DefaultWorkspace, ProjectId = ScopeIds.DefaultProject, });

        SponsorEvidencePackService sut = CreateSut(
            snapshot.Object,
            runs.Object,
            deltas.Object,
            findingsRepo.Object,
            gov.Object,
            scopeProvider.Object);

        SponsorEvidencePackResponse result = await sut.BuildAsync(CancellationToken.None);

        result.DemoRunValueReportDelta.Should().BeNull();
        result.ExplainabilityTrace.TotalFindings.Should().Be(0);
        deltas.Verify(
            d => d.ComputeAsync(It.IsAny<ArchitectureRunDetail>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_loads_findings_snapshot_and_computes_pilot_delta_when_run_present()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        ArchitectureRunDetail detail = new() { Run = new ArchitectureRun { RunId = "runid", RequestId = "req", FindingsSnapshotId = snapshotId, }, };

        FindingsSnapshot persisted = new()
        {
            FindingsSnapshotId = snapshotId,
            Findings =
            [
                new Finding
                {
                    FindingId = "f1",
                    EngineType = "TestEngine",
                    FindingType = "type",
                    Category = "cat",
                    Severity = FindingSeverity.Warning,
                    Title = "t",
                    Rationale = "r",
                    Trace = new(),
                },
            ],
        };

        WhyArchLucidSnapshotResponse snap = new() { DemoRunId = "runid", GeneratedUtc = TimeProvider.System.GetUtcNow(), };

        Mock<IWhyArchLucidSnapshotService> snapshot = new();
        snapshot.Setup(s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(snap);

        Mock<IRunDetailQueryService> runs = new();
        runs.Setup(r => r.GetRunDetailAsync("runid", It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PilotRunDeltas
                {
                    RunCreatedUtc = TimeProvider.System.UtcNowDateTime(), AuditRowCount = 1, LlmCallCount = 2, IsDemoTenant = true,
                });

        Mock<IFindingsSnapshotRepository> findingsRepo = new();
        findingsRepo
            .Setup(f => f.GetByIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(persisted);

        Mock<IGovernanceDashboardService> gov = new();
        gov.Setup(g =>
                g.GetDashboardAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new GovernanceDashboardSummary { PendingCount = 2, RecentDecisions = [new GovernanceApprovalRequest()], RecentChanges = [], });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(sp => sp.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = ScopeIds.DefaultTenant, WorkspaceId = ScopeIds.DefaultWorkspace, ProjectId = ScopeIds.DefaultProject, });

        SponsorEvidencePackService sut = CreateSut(
            snapshot.Object,
            runs.Object,
            deltas.Object,
            findingsRepo.Object,
            gov.Object,
            scopeProvider.Object);

        SponsorEvidencePackResponse result = await sut.BuildAsync(CancellationToken.None);

        result.DemoRunValueReportDelta.Should().NotBeNull();
        result.DemoRunValueReportDelta!.IsDemoTenant.Should().BeTrue();
        result.DemoRunValueReportDelta.RoiSourceFreshnessDisposition.Should().NotBeNullOrWhiteSpace();
        result.ExplainabilityTrace.TotalFindings.Should().Be(1);
        result.GovernanceOutcomes.PendingApprovalCount.Should().Be(2);
    }

    private static SponsorEvidencePackService CreateSut(
        IWhyArchLucidSnapshotService snapshot,
        IRunDetailQueryService runs,
        IPilotRunDeltaComputer deltas,
        IFindingsSnapshotRepository findingsRepo,
        IGovernanceDashboardService gov,
        IScopeContextProvider scopeProvider)
    {
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ValueReportRawMetrics(
                    [],
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    40m,
                    "signup",
                    DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
                    12m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        Mock<IPilotBaselineRepository> baselines = new();
        baselines
            .Setup(repo => repo.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PilotBaselineRecord?)null);

        RoiCostEvidenceCollectionResolver collectionResolver =
            RoiCostEvidenceCollectionResolverTestSupport.Create(
                new Mock<IAzureExtractorPackageRepository>().Object,
                new Mock<ICloudInventoryExtractorPackageRepository>().Object);

        return new SponsorEvidencePackService(
            snapshot,
            runs,
            deltas,
            findingsRepo,
            gov,
            scopeProvider,
            new ValueReportBuilder(metrics.Object, opt.Object),
            collectionResolver,
            baselines.Object,
            NullLogger<SponsorEvidencePackService>.Instance);
    }
}
