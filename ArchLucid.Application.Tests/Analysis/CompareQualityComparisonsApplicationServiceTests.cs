using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareQualityComparisonsApplicationServiceTests
{
    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_query_uses_dashed_guid_and_persisted_left_uses_n_format()
    {
        Guid runKey = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string canonicalRunId = runKey.ToString("N");
        string dashedRunId = runKey.ToString("D");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-guid-list",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = canonicalRunId,
                RightRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(dashedRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(dashedRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-guid-list");
    }

    [Fact]
    public async Task CompareQuality_TryListByExportRecordIdAsync_lists_records_when_query_uses_padded_export_record_id()
    {
        const string exportRecordId = "export-anchor-id";
        const string runId = "dddddddddddddddddddddddddddddddd";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-by-export",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = exportRecordId,
                RightExportRecordId = "other-export",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(exportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = exportRecordId, RunId = runId });
        exportRecords
            .Setup(r => r.GetByIdAsync(It.Is<string>(id => id != exportRecordId), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportRecord?)null);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            exportRecords.Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByExportRecordIdAsync($"  {exportRecordId}  ", CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-by-export");
        exportRecords.Verify(r => r.GetByIdAsync(exportRecordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_left_run_filter_uses_dashed_guid_and_persisted_left_uses_n_format()
    {
        Guid leftKey = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string canonicalLeftRunId = leftKey.ToString("N");
        string dashedLeftRunId = leftKey.ToString("D");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-left",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = canonicalLeftRunId,
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        ComparisonsApplicationService sut = new(
            new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonHistorySearchResult result = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria { LeftRunId = dashedLeftRunId, Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-left");
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_audit_persisted_record_when_report_used_dashed_left_run_id()
    {
        Guid leftKey = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string dashedLeftRunId = leftKey.ToString("D");
        string canonicalLeftRunId = leftKey.ToString("N");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        ComparisonAuditService audit = new(comparisonRecords, Mock.Of<IAuditService>());
        await audit.RecordEndToEndAsync(
            new EndToEndReplayComparisonReport
            {
                LeftRunId = dashedLeftRunId,
                RightRunId = "cccccccccccccccccccccccccccccccc",
            },
            "# summary",
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(dashedLeftRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalLeftRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(dashedLeftRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle();
        records[0].LeftRunId.Should().Be(canonicalLeftRunId);
    }

    [Fact]
    public async Task CompareQuality_RecordEndToEndAsync_payload_run_ids_match_canonical_record_columns_when_report_uses_dashed_guids()
    {
        Guid leftKey = Guid.Parse("77777777-7777-7777-7777-777777777777");
        string dashedLeftRunId = leftKey.ToString("D");
        string canonicalLeftRunId = leftKey.ToString("N");

        ComparisonRecord? captured = null;
        Mock<IComparisonRecordRepository> repo = new();
        repo
            .Setup(r => r.CreateAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .Callback<ComparisonRecord, CancellationToken>((record, _) => captured = record)
            .Returns(Task.CompletedTask);

        ComparisonAuditService audit = new(repo.Object, Mock.Of<IAuditService>());
        await audit.RecordEndToEndAsync(
            new EndToEndReplayComparisonReport
            {
                LeftRunId = dashedLeftRunId,
                RightRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            },
            "# summary",
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.LeftRunId.Should().Be(canonicalLeftRunId);

        EndToEndReplayComparisonReport? payload = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(captured);
        payload.Should().NotBeNull();
        payload!.LeftRunId.Should().Be(canonicalLeftRunId);
    }

    [Fact]
    public async Task CompareQuality_TryBuildBatchReplayZipAsync_throws_career_posture_block_instead_of_swallowing_as_total_failure()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync("cmp-career", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ComparisonRecord
                {
                    ComparisonRecordId = "cmp-career",
                    LeftRunId = runId,
                    ComparisonType = ComparisonTypes.ExportRecordDiff,
                    CreatedUtc = DateTime.UtcNow,
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisons.Object,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        Func<Task> act = () => sut.TryBuildBatchReplayZipAsync(
            ["cmp-career"],
            format: "markdown",
            replayMode: "artifact",
            profile: null,
            persistReplay: false,
            CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
    }

    [Fact]
    public async Task CompareQuality_TryReplaySummaryMarkdownAsync_applies_career_gate_when_summary_markdown_is_already_stored()
    {
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-stored-summary",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftRunId = runId,
                RightRunId = "cccccccccccccccccccccccccccccccc",
                SummaryMarkdown = "## Stored summary",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.EnsureArtifactReplayAccessAllowedAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        Func<Task> act = () => sut.TryReplaySummaryMarkdownAsync("cmp-stored-summary", CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        replay.Verify(
            s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordForArtifactReadAsync_throws_when_career_posture_blocks_metadata_read()
    {
        const string runId = "dddddddddddddddddddddddddddddddd";
        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-artifact-read",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftRunId = runId,
                RightRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                PayloadJson = "{}",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.EnsureArtifactReplayAccessAllowedAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        Func<Task> act = () => sut.TryGetScopedRecordForArtifactReadAsync("cmp-artifact-read", CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
    }

    [Fact]
    public async Task CompareQuality_TryEstimateReplayCostAsync_throws_when_career_posture_blocks_metadata_read()
    {
        const string runId = "ffffffffffffffffffffffffffffffff";
        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-cost-estimate",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftRunId = runId,
                RightRunId = "10101010101010101010101010101010",
                PayloadJson = "{}",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.EnsureArtifactReplayAccessAllowedAsync(It.IsAny<ComparisonRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        Mock<IComparisonReplayCostEstimator> estimator = new();

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            estimator.Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        Func<Task> act = () => sut.TryEstimateReplayCostAsync(
            "cmp-cost-estimate",
            format: "markdown",
            replayMode: "artifact",
            persistReplay: false,
            CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        estimator.Verify(
            e => e.TryEstimateAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_TryBuildBatchReplayZipAsync_rethrows_verification_failure_instead_of_batch_all_failed()
    {
        const string runId = "12121212121212121212121212121212";
        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync("cmp-verify", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ComparisonRecord
                {
                    ComparisonRecordId = "cmp-verify",
                    LeftRunId = runId,
                    ComparisonType = ComparisonTypes.ExportRecordDiff,
                    CreatedUtc = DateTime.UtcNow,
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ComparisonVerificationFailedException("drift detected"));

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisons.Object,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        Func<Task> act = () => sut.TryBuildBatchReplayZipAsync(
            ["cmp-verify"],
            format: "markdown",
            replayMode: "verify",
            profile: null,
            persistReplay: false,
            CancellationToken.None);

        await act.Should().ThrowAsync<ComparisonVerificationFailedException>();
    }
}
