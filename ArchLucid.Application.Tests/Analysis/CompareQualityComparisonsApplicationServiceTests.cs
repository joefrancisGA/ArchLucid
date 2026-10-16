using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
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
}
