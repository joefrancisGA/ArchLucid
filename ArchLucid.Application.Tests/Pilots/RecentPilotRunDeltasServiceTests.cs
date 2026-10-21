using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

/// <summary>
///     Unit tests for <see cref="RecentPilotRunDeltasService" /> — the new aggregator behind
///     <c>GET /v1/pilots/runs/recent-deltas</c> that powers the BeforeAfterDeltaPanel top / sidebar variants.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RecentPilotRunDeltasServiceTests
{
    [SkippableFact]
    public async Task GetRecentDeltasAsync_ExcludesReadyForCommitRunWithManifestVersion()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        DateTime baseTime = new(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc);
        RunSummary readyForCommit = new()
        {
            RunId = "readyforcommmitreadyforcommitaaa",
            RequestId = "req-ready",
            Status = nameof(ArchitectureRunStatus.ReadyForCommit),
            CreatedUtc = baseTime,
            CompletedUtc = baseTime,
            CurrentManifestVersion = "v1",
            SystemName = "Demo",
        };
        RunSummary committed = BuildSummary("newcommit22222222222222222222cccc", "req-A", baseTime.AddMinutes(-10), committed: true);

        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync([readyForCommit, committed]);

        StubDetailAndDelta(queryService, deltaComputer, readyForCommit, findingsCount: 6, secondsToCommit: 75);
        StubDetailAndDelta(queryService, deltaComputer, committed, findingsCount: 2, secondsToCommit: 90);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Should().HaveCount(1);
        response.Items[0].RunId.Should().Be(committed.RunId);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_WhenSortKeysTie_OrdersByRunIdDescendingSoPanelOrderIsStable()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        DateTime tieUtc = new(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc);
        RunSummary runA = new()
        {
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RequestId = "req-a",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = tieUtc,
            CompletedUtc = tieUtc,
            CurrentManifestVersion = "v1",
            SystemName = "Demo",
        };
        RunSummary runB = new()
        {
            RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            RequestId = "req-b",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = tieUtc,
            CompletedUtc = tieUtc,
            CurrentManifestVersion = "v1",
            SystemName = "Demo",
        };

        queryService
            .Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([runA, runB]);

        StubDetailAndDelta(queryService, deltaComputer, runA, findingsCount: 1, secondsToCommit: 30);
        StubDetailAndDelta(queryService, deltaComputer, runB, findingsCount: 2, secondsToCommit: 30);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Select(i => i.RunId).Should().Equal(runB.RunId, runA.RunId);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_FiltersToCommittedRuns_NewestFirst_AndClampsCount()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        DateTime baseTime = new(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc);
        List<RunSummary> all =
        [
            BuildSummary("oldcommit11111111111111111111aaaa", "req-A", baseTime.AddMinutes(-30), committed: true),
            BuildSummary("uncommitted000000000000000000bbbb", "req-B", baseTime.AddMinutes(-20), committed: false),
            BuildSummary("newcommit22222222222222222222cccc", "req-A", baseTime.AddMinutes(-10), committed: true),
            BuildSummary("midcommit33333333333333333333dddd", "req-A", baseTime.AddMinutes(-15), committed: true),
        ];

        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(all);

        StubDetailAndDelta(queryService, deltaComputer, all[0], findingsCount: 4, secondsToCommit: 60);
        StubDetailAndDelta(queryService, deltaComputer, all[2], findingsCount: 2, secondsToCommit: 90);
        StubDetailAndDelta(queryService, deltaComputer, all[3], findingsCount: 6, secondsToCommit: 75);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(2);

        response.RequestedCount.Should().Be(2);
        response.ReturnedCount.Should().Be(2);
        response.Items.Select(i => i.RunId).Should().Equal(
            "newcommit22222222222222222222cccc",
            "midcommit33333333333333333333dddd");
        response.MedianTotalFindings.Should().Be(4);
        response.MedianTimeToCommittedManifestTotalSeconds.Should().BeApproximately(82.5, 0.001);
        response.MedianLlmCallCount.Should().Be(0);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_ClampsCountAboveMaxToHardCeiling()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();
        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<RunSummary>());

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(9999);

        response.RequestedCount.Should().Be(IRecentPilotRunDeltasService.MaxCount);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_ClampsZeroOrNegativeToMin()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();
        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<RunSummary>());

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(0);

        response.RequestedCount.Should().Be(IRecentPilotRunDeltasService.MinCount);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_WithNoCommittedRuns_ReturnsEmptyAndNullMedians()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();
        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
        [
            BuildSummary("uncommitted0000000000000000000aaa", "req-A", TimeProvider.System.UtcNowDateTime(), committed: false),
        ]);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Should().BeEmpty();
        response.ReturnedCount.Should().Be(0);
        response.MedianTotalFindings.Should().BeNull();
        response.MedianTimeToCommittedManifestTotalSeconds.Should().BeNull();
        response.MedianLlmCallCount.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_SkipsRunsWhereDetailLookupReturnsNull()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        RunSummary good = BuildSummary("goodgoodgoodgoodgoodgoodgoodaaaa", "req-A", TimeProvider.System.UtcNowDateTime(), committed: true);
        RunSummary missing = BuildSummary("missingmissingmissingmissing0001", "req-B", TimeProvider.System.UtcNowDateTime().AddMinutes(-1),
            committed: true);

        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync([good, missing]);

        StubDetailAndDelta(queryService, deltaComputer, good, findingsCount: 1, secondsToCommit: 30);
        queryService
            .Setup(q => q.GetRunDetailForRoiAsync(missing.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Should().HaveCount(1);
        response.Items[0].RunId.Should().Be(good.RunId);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_SkipsRunsWhereDeltaComputerThrows_AndKeepsOthers()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        RunSummary good = BuildSummary("goodgoodgoodgoodgoodgoodgoodaaaa", "req-A", TimeProvider.System.UtcNowDateTime(), committed: true);
        RunSummary fails = BuildSummary("failfailfailfailfailfailfailbbbb", "req-B", TimeProvider.System.UtcNowDateTime().AddMinutes(-1),
            committed: true);

        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync([good, fails]);

        StubDetailAndDelta(queryService, deltaComputer, good, findingsCount: 1, secondsToCommit: 30);
        ArchitectureRunDetail failsDetail = BuildDetail(fails);
        queryService.Setup(q => q.GetRunDetailForRoiAsync(fails.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(failsDetail);
        deltaComputer
            .Setup(d => d.ComputeAsync(failsDetail, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("delta computer offline"));

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Should().HaveCount(1);
        response.Items[0].RunId.Should().Be(good.RunId);
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_backfills_older_committed_runs_when_newest_projections_fail()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        DateTime baseTime = new(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc);
        RunSummary olderA = BuildSummary("goodgoodgoodgoodgoodgoodgoodgggg", "req-ga", baseTime.AddHours(-2), committed: true);
        RunSummary olderB = BuildSummary("goodgoodgoodgoodgoodgoodgoodhhhh", "req-gb", baseTime.AddHours(-3), committed: true);
        RunSummary failNewest = BuildSummary("failfailfailfailfailfailfailffff", "req-f1", baseTime, committed: true);
        RunSummary failOlder = BuildSummary("failfailfailfailfailfailfaileeee", "req-f2", baseTime.AddMinutes(-5), committed: true);

        queryService
            .Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([failNewest, failOlder, olderA, olderB]);

        StubDetailAndDelta(queryService, deltaComputer, olderA, findingsCount: 2, secondsToCommit: 40);
        StubDetailAndDelta(queryService, deltaComputer, olderB, findingsCount: 4, secondsToCommit: 50);

        ArchitectureRunDetail failNewestDetail = BuildDetail(failNewest);
        ArchitectureRunDetail failOlderDetail = BuildDetail(failOlder);
        queryService.Setup(q => q.GetRunDetailForRoiAsync(failNewest.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(failNewestDetail);
        queryService.Setup(q => q.GetRunDetailForRoiAsync(failOlder.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(failOlderDetail);
        deltaComputer
            .Setup(d => d.ComputeAsync(failNewestDetail, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("projection failed"));
        deltaComputer
            .Setup(d => d.ComputeAsync(failOlderDetail, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("projection failed"));

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(2);

        response.ReturnedCount.Should().Be(2);
        response.Items.Select(i => i.RunId).Should().Equal(olderA.RunId, olderB.RunId);
    }

    [SkippableFact]
    public void ComputeMedian_OnOddSample_ReturnsMiddleValue()
    {
        double? result = RecentPilotRunDeltasService.ComputeMedian([3, 1, 2]);

        result.Should().Be(2);
    }

    [SkippableFact]
    public void ComputeMedian_OnEvenSample_ReturnsAverageOfMiddleTwo()
    {
        double? result = RecentPilotRunDeltasService.ComputeMedian([10, 4, 2, 8]);

        result.Should().Be(6);
    }

    [SkippableFact]
    public void ComputeMedian_OnEmpty_ReturnsNull()
    {
        double? result = RecentPilotRunDeltasService.ComputeMedian([]);

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetRecentDeltasAsync_WhenLlmTracesUnresolved_LlmCallCountIsNullOnRow()
    {
        Mock<IRunDetailQueryService> queryService = new();
        Mock<IPilotRunDeltaComputer> deltaComputer = new();

        RunSummary summary = BuildSummary("goodgoodgoodgoodgoodgoodgoodaaaa", "req-A", TimeProvider.System.UtcNowDateTime(), committed: true);
        queryService.Setup(q => q.ListRunSummariesAsync(It.IsAny<CancellationToken>())).ReturnsAsync([summary]);
        StubDetailAndDelta(queryService, deltaComputer, summary, findingsCount: 2, secondsToCommit: 60, llmCallCount: 0, llmCallCountResolved: false);

        RecentPilotRunDeltasService sut = BuildSut(queryService, deltaComputer);

        RecentPilotRunDeltasResponse response = await sut.GetRecentDeltasAsync(5);

        response.Items.Should().ContainSingle();
        response.Items[0].LlmCallCountResolved.Should().BeFalse();
        response.Items[0].LlmCallCount.Should().BeNull();
        response.MedianLlmCallCount.Should().BeNull();
    }

    private static RecentPilotRunDeltasService BuildSut(
        Mock<IRunDetailQueryService> queryService,
        Mock<IPilotRunDeltaComputer> deltaComputer) =>
        new(queryService.Object, deltaComputer.Object, NullLogger<RecentPilotRunDeltasService>.Instance);

    private static RunSummary BuildSummary(string runId, string requestId, DateTime completedUtc, bool committed) =>
        new()
        {
            RunId = runId,
            RequestId = requestId,
            Status = committed ? "Committed" : "Created",
            CreatedUtc = completedUtc.AddMinutes(-30),
            CompletedUtc = completedUtc,
            CurrentManifestVersion = committed ? "v1" : null,
            SystemName = "Demo",
        };

    private static void StubDetailAndDelta(
        Mock<IRunDetailQueryService> queryService,
        Mock<IPilotRunDeltaComputer> deltaComputer,
        RunSummary summary,
        int findingsCount,
        double secondsToCommit,
        int llmCallCount = 0,
        bool llmCallCountResolved = true)
    {
        ArchitectureRunDetail detail = BuildDetail(summary);

        queryService
            .Setup(q => q.GetRunDetailForRoiAsync(summary.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        DateTime committed = detail.Run.CreatedUtc.AddSeconds(secondsToCommit);

        deltaComputer
            .Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotRunDeltas
            {
                RunCreatedUtc = detail.Run.CreatedUtc,
                ManifestCommittedUtc = committed,
                TimeToCommittedManifest = TimeSpan.FromSeconds(secondsToCommit),
                FindingsBySeverity = BuildSeverityCounts(findingsCount),
                AuditRowCount = 0,
                AuditRowCountTruncated = false,
                LlmCallCount = llmCallCount,
                LlmCallCountResolved = llmCallCountResolved,
                TopFindingSeverity = findingsCount > 0 ? "High" : null,
                TopFindingId = findingsCount > 0 ? "f-1" : null,
                TopFindingEvidenceChain = null,
                IsDemoTenant = false,
            });
    }

    private static IReadOnlyList<KeyValuePair<string, int>> BuildSeverityCounts(int total) =>
        total <= 0
            ? []
            :
            [
                new KeyValuePair<string, int>("High", total),
            ];

    private static ArchitectureRunDetail BuildDetail(RunSummary summary)
    {
        DateTime created = summary.CreatedUtc;
        ArchitectureRun run = new()
        {
            RunId = summary.RunId,
            RequestId = summary.RequestId,
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = created,
            CompletedUtc = summary.CompletedUtc,
            CurrentManifestVersion = summary.CurrentManifestVersion,
        };

        GoldenManifest? manifest = summary.CurrentManifestVersion is null
            ? null
            : new GoldenManifest
            {
                RunId = summary.RunId,
                SystemName = "Demo",
                Metadata = new ManifestMetadata { ManifestVersion = summary.CurrentManifestVersion, CreatedUtc = summary.CompletedUtc ?? created },
                Governance = new ManifestGovernance(),
            };

        return new ArchitectureRunDetail
        {
            Run = run, Manifest = manifest, Results = [], DecisionTraces = [],
        };
    }
}
