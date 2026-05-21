using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class ExecutiveRoiSummaryServiceTests
{
    [Fact]
    public async Task BuildAsync_returns_empty_summary_when_no_committed_runs()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, null));

        ExecutiveRoiSummaryService sut = CreateSut(runQuery.Object, Mock.Of<IFindingsSnapshotRepository>());

        ExecutiveRoiSummaryResponse response = await sut.BuildAsync(CancellationToken.None);

        response.TotalEstimatedUsdSavings.Should().Be(0m);
        response.SystemCount.Should().Be(0);
        response.TopSystemicIssues.Should().BeEmpty();
    }

    [Fact]
    public async Task BuildAsync_uses_latest_run_per_system_and_sums_savings()
    {
        DateTime older = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 10, 0, 0, 0, DateTimeKind.Utc);
        Guid olderRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid newerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid findingsSnapshotId = Guid.Parse("cccccccccccccccccccccccccccccccc");

        RunSummary olderSummary = new()
        {
            RunId = olderRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = older,
            CurrentManifestVersion = "v1",
        };

        RunSummary newerSummary = new()
        {
            RunId = newerRunId.ToString("N"),
            SystemName = "Payments",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = newer,
            CurrentManifestVersion = "v2",
        };

        RunSummary otherSystemSummary = new()
        {
            RunId = Guid.Parse("dddddddddddddddddddddddddddddddd").ToString("N"),
            SystemName = "Claims",
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = newer,
            CurrentManifestVersion = "v1",
        };

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { newerSummary, olderSummary, otherSystemSummary }, false, null));

        runQuery
            .Setup(query => query.GetRunDetailAsync(newerRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(newerRunId, "Payments", findingsSnapshotId, newer, [
                new ArchitectureFinding { Category = "Security", Severity = FindingSeverity.Error, Message = "a" },
                new ArchitectureFinding { Category = "Security", Severity = FindingSeverity.Error, Message = "b" },
            ]));

        runQuery
            .Setup(query => query.GetRunDetailAsync(otherSystemSummary.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDetail(Guid.Parse(otherSystemSummary.RunId), "Claims", null, newer, [
                new ArchitectureFinding { Category = "Compliance", Severity = FindingSeverity.Warning, Message = "c" },
            ]));

        Mock<IFindingsSnapshotRepository> findingsRepo = new();
        findingsRepo
            .Setup(repo => repo.GetByIdAsync(findingsSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingsSnapshot { FindingsSnapshotId = findingsSnapshotId, TotalEstimatedSavings = 12500m });

        ExecutiveRoiSummaryService sut = CreateSut(runQuery.Object, findingsRepo.Object);

        ExecutiveRoiSummaryResponse response = await sut.BuildAsync(CancellationToken.None);

        response.SystemCount.Should().Be(2);
        response.TotalEstimatedUsdSavings.Should().Be(12500m);
        response.Systems.Should().ContainSingle(system => system.SystemName == "Payments" && system.EstimatedUsdSavings == 12500m);
        response.TopSystemicIssues.Should().HaveCount(2);
        response.TopSystemicIssues[0].Category.Should().Be("Security");
        response.TopSystemicIssues[0].Severity.Should().Be(nameof(FindingSeverity.Error));
        response.TopSystemicIssues[0].Count.Should().Be(2);
    }

    private static ExecutiveRoiSummaryService CreateSut(
        IRunDetailQueryService runDetailQueryService,
        IFindingsSnapshotRepository findingsSnapshotRepository)
    {
        return new ExecutiveRoiSummaryService(
            runDetailQueryService,
            findingsSnapshotRepository,
            NullLogger<ExecutiveRoiSummaryService>.Instance);
    }

    private static ArchitectureRunDetail BuildDetail(
        Guid runId,
        string systemName,
        Guid? findingsSnapshotId,
        DateTime committedUtc,
        IReadOnlyList<ArchitectureFinding> findings)
    {
        ArchitectureRun run = new()
        {
            RunId = runId.ToString("N"),
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = committedUtc.AddHours(-1),
            CompletedUtc = committedUtc,
            CurrentManifestVersion = "v1",
            FindingsSnapshotId = findingsSnapshotId,
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = new GoldenManifest
            {
                RunId = run.RunId,
                SystemName = systemName,
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = committedUtc },
                Governance = new ManifestGovernance(),
            },
            Results =
            [
                new AgentResult
                {
                    TaskId = "t1",
                    RunId = run.RunId,
                    AgentType = AgentType.Topology,
                    Findings = findings.ToList(),
                },
            ],
        };
    }
}
