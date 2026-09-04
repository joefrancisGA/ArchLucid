using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonsApplicationServiceTests
{
    [Fact]
    public async Task TryListByRunIdAsync_returns_null_when_run_is_missing()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        ComparisonsApplicationService sut = CreateSut(runDetail: runDetail.Object);

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync("missing", CancellationToken.None);

        records.Should().BeNull();
    }

    [Fact]
    public void TryBuildDriftReportContent_returns_null_for_unsupported_format()
    {
        ComparisonsApplicationService sut = CreateSut();

        DriftReportContent? content = sut.TryBuildDriftReportContent(
            new DriftAnalysisResult { DriftDetected = false, Summary = "ok", Items = [] },
            "cmp-1",
            "pdf");

        content.Should().BeNull();
    }

    [Fact]
    public async Task TryBuildBatchReplayZipAsync_returns_null_when_every_replay_fails()
    {
        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync("cmp-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ComparisonRecord
                {
                    ComparisonRecordId = "cmp-1",
                    LeftRunId = "run-left",
                    ComparisonType = "end-to-end",
                    CreatedUtc = DateTime.UtcNow,
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-left", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        ComparisonsApplicationService sut = CreateSut(
            runDetail: runDetail.Object,
            comparisonRecords: comparisons.Object);

        Application.Analysis.ComparisonBatchReplay.ComparisonBatchReplayZipResult? zip =
            await sut.TryBuildBatchReplayZipAsync(
                ["cmp-1"],
                format: "markdown",
                replayMode: "artifact",
                profile: null,
                persistReplay: false,
                CancellationToken.None);

        zip.Should().BeNull();
    }

    [Fact]
    public async Task TryGetScopedRecordAsync_returns_record_when_only_left_run_anchor_is_in_scope()
    {
        ComparisonRecord record = new()
        {
            ComparisonRecordId = "cmp-1",
            LeftRunId = "run-left",
            RightRunId = "run-right",
            ComparisonType = "end-to-end",
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync("cmp-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-left", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = "run-left" } });
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-right", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        ComparisonsApplicationService sut = CreateSut(
            runDetail: runDetail.Object,
            comparisonRecords: comparisons.Object);

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync("cmp-1", CancellationToken.None);

        scoped.Should().NotBeNull(
            "artifact replay intentionally allows access when any comparison anchor is in scope");
    }

    private static ComparisonsApplicationService CreateSut(
        IRunDetailQueryService? runDetail = null,
        IComparisonRecordRepository? comparisonRecords = null)
    {
        return new ComparisonsApplicationService(
            runDetail ?? new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords ?? new Mock<IComparisonRecordRepository>().Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());
    }
}
