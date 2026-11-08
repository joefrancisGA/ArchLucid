using System.Reflection;

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
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_query_run_id_differs_only_by_casing()
    {
        const string canonicalRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const string uppercaseRunId = "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-list-run-casing",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = canonicalRunId,
                RightRunId = "ffffffffffffffffffffffffffffffff",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
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
            await sut.TryListByRunIdAsync(uppercaseRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-list-run-casing");
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_repository_matches_only_alternate_run_id_key()
    {
        const string canonicalRunId = "dddddddddddddddddddddddddddddddd";

        ComparisonRecord persisted = new()
        {
            ComparisonRecordId = "cmp-list-legacy-repo-key",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalRunId,
            RightRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([persisted]);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(canonicalRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-list-legacy-repo-key");
        comparisonRecords.Verify(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_merges_records_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "cccccccccccccccccccccccccccccccc";

        ComparisonRecord canonicalKeyed = new()
        {
            ComparisonRecordId = "cmp-canonical-repo-key",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalRunId,
            RightRunId = "dddddddddddddddddddddddddddddddd",
            CreatedUtc = DateTime.UtcNow,
        };
        ComparisonRecord legacyKeyed = new()
        {
            ComparisonRecordId = "cmp-legacy-repo-key",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalRunId,
            RightRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed, legacyKeyed]);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(canonicalRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().Contain(r => r.ComparisonRecordId == "cmp-canonical-repo-key");
        records.Should().Contain(r => r.ComparisonRecordId == "cmp-legacy-repo-key");
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_orders_merged_records_by_created_utc_descending()
    {
        const string canonicalRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        ComparisonRecord older = new()
        {
            ComparisonRecordId = "cmp-older-canonical-key",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalRunId,
            RightRunId = "cccccccccccccccccccccccccccccccc",
            CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
        };
        ComparisonRecord newer = new()
        {
            ComparisonRecordId = "cmp-newer-legacy-key",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = canonicalRunId,
            RightRunId = "dddddddddddddddddddddddddddddddd",
            CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
        };

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([newer, older]);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        IReadOnlyList<ComparisonRecord>? records =
            await sut.TryListByRunIdAsync(canonicalRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().HaveCount(2);
        records[0].ComparisonRecordId.Should().Be("cmp-newer-legacy-key");
        records[1].ComparisonRecordId.Should().Be("cmp-older-canonical-key");
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_persisted_left_uses_dashed_guid_and_query_uses_n_format()
    {
        Guid runKey = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string canonicalRunId = runKey.ToString("N");
        string dashedRunId = runKey.ToString("D");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-guid-list-dashed-stored",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = dashedRunId,
                RightRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
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
            await sut.TryListByRunIdAsync(canonicalRunId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-guid-list-dashed-stored");
        records[0].LeftRunId.Should().Be(canonicalRunId);
    }

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
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
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
    public async Task CompareQuality_TryListByRunIdAsync_trims_padded_comparison_record_id_from_list_rows()
    {
        const string canonicalComparisonRecordId = "cmp-run-list-trim";
        const string runId = "cccccccccccccccccccccccccccccccc";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = $"  {canonicalComparisonRecordId}  ",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "dddddddddddddddddddddddddddddddd",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

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
            await sut.TryListByRunIdAsync(runId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle();
        records[0].ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_trims_padded_comparison_record_id_in_results_and_next_cursor()
    {
        const string canonicalComparisonRecordId = "cmp-search-next-cursor-trim";
        DateTime older = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = $"  {canonicalComparisonRecordId}  ",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = newer,
            },
            CancellationToken.None);
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-next-cursor-other",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = older,
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

        ComparisonHistorySearchResult page = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria
            {
                SortBy = "createdUtc",
                SortDir = "desc",
                Limit = 1,
            },
            CancellationToken.None);

        page.Records.Should().ContainSingle();
        page.Records[0].ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
        page.NextCursor.Should().Be($"{newer.Ticks}:{canonicalComparisonRecordId}");
    }

    [Fact]
    public async Task CompareQuality_TryListByRunIdAsync_lists_records_when_query_run_id_has_trailing_line_break()
    {
        const string canonicalRunId = "44444444444444444444444444444444";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-run-trim-list",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = canonicalRunId,
                RightRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
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
            await sut.TryListByRunIdAsync($"{canonicalRunId}\n", CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-run-trim-list");
        runDetail.Verify(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_finds_record_when_comparison_id_differs_only_by_casing()
    {
        const string storedComparisonRecordId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string lookupComparisonRecordId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = storedComparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "cccccccccccccccccccccccccccccccc",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(lookupComparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonRecordId.Should().Be(storedComparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_trims_padded_comparison_record_id_from_stored_row()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string canonicalComparisonRecordId = "cmp-scoped-read-trim";
        ComparisonRecord record = new()
        {
            ComparisonRecordId = $"  {canonicalComparisonRecordId}  ",
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = runId,
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            CreatedUtc = DateTime.UtcNow,
        };
        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByIdAsync(canonicalComparisonRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(canonicalComparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_returns_record_when_comparison_id_has_trailing_line_break()
    {
        const string comparisonRecordId = "cmp-scoped-trim-id";
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "ffffffffffffffffffffffffffffffff",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync($"{comparisonRecordId}\n", CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonRecordId.Should().Be(comparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_returns_record_when_stored_left_run_id_is_dashed_guid_with_padding()
    {
        const string comparisonRecordId = "cmp-scoped-dashed-run-id";
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string canonicalRunId = runGuid.ToString("N");
        string dashedPaddedRunId = $"{runGuid:D}  ";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = dashedPaddedRunId,
                RightRunId = "ffffffffffffffffffffffffffffffff",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
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

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(comparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonRecordId.Should().Be(comparisonRecordId);
        runDetail.Verify(
            s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_TryListByExportRecordIdAsync_lists_records_when_query_differs_only_by_casing()
    {
        const string storedExportRecordId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string lookupExportRecordId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        const string runId = "dddddddddddddddddddddddddddddddd";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-by-export-casing",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = storedExportRecordId,
                RightExportRecordId = "other-export",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(lookupExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = storedExportRecordId, RunId = runId });

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

        IReadOnlyList<ComparisonRecord>? listed =
            await sut.TryListByExportRecordIdAsync(lookupExportRecordId, CancellationToken.None);

        listed.Should().NotBeNull();
        listed!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-by-export-casing");
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
    public async Task CompareQuality_TryListByExportRecordIdAsync_lists_when_export_record_run_id_is_dashed_guid_with_padding()
    {
        const string exportRecordId = "export-dashed-run-id";
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string canonicalRunId = runGuid.ToString("N");
        string dashedPaddedRunId = $"{runGuid:D}  ";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-by-export-dashed-run",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = exportRecordId,
                RightExportRecordId = "other-export",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(exportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord { ExportRecordId = exportRecordId, RunId = dashedPaddedRunId });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = canonicalRunId } });

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
            await sut.TryListByExportRecordIdAsync(exportRecordId, CancellationToken.None);

        records.Should().NotBeNull();
        records!.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-by-export-dashed-run");
        runDetail.Verify(
            s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_TryListByExportRecordIdAsync_clears_stale_denormalized_determinism_iterations_on_scoped_export_load()
    {
        const string exportRecordId = "export-determinism-normalize";
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-export-determinism",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = exportRecordId,
                RightExportRecordId = "other-export",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        RunExportRecord storedExport = new()
        {
            ExportRecordId = exportRecordId,
            RunId = runId,
            IncludedDeterminismCheck = false,
            DeterminismIterations = 4,
        };

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(exportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(storedExport);

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
            await sut.TryListByExportRecordIdAsync(exportRecordId, CancellationToken.None);

        records.Should().NotBeNull();
        storedExport.DeterminismIterations.Should().BeNull();
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_left_export_filter_differs_only_by_casing()
    {
        const string storedExportRecordId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string filterExportRecordId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-export-casing",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = storedExportRecordId,
                RightExportRecordId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
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
            new ComparisonHistorySearchCriteria { LeftExportRecordId = filterExportRecordId, Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-export-casing");
        result.Records[0].LeftExportRecordId.Should().Be(storedExportRecordId);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_left_export_filter_is_padded_and_stored_anchor_has_padding()
    {
        const string exportRecordId = "search-left-export";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-export",
                ComparisonType = ComparisonTypes.ExportRecordDiff,
                LeftExportRecordId = $"  {exportRecordId}  ",
                RightExportRecordId = "other-export",
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
            new ComparisonHistorySearchCriteria { LeftExportRecordId = $"  {exportRecordId}  ", Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-export");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_passes_trimmed_export_record_filters_to_repository()
    {
        const string exportRecordId = "trim-search-export";

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.SearchAsync(
                null,
                null,
                null,
                null,
                null,
                exportRecordId,
                null,
                null,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                0,
                10,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ComparisonsApplicationService sut = new(
            new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        await sut.SearchAsync(
            new ComparisonHistorySearchCriteria { LeftExportRecordId = $"  {exportRecordId}  ", Limit = 10 },
            CancellationToken.None);

        comparisonRecords.Verify(
            r => r.SearchAsync(
                null,
                null,
                null,
                null,
                null,
                exportRecordId,
                null,
                null,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                0,
                10,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_cursor_paging_trims_padded_comparison_record_id()
    {
        DateTime oldest = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime middle = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime newest = new(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc);

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-cursor-oldest",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = oldest,
            },
            CancellationToken.None);
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-cursor-middle",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = middle,
            },
            CancellationToken.None);
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-cursor-newest",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = newest,
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

        ComparisonHistorySearchResult page = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria
            {
                UseCursorPaging = true,
                SortBy = "createdUtc",
                SortDir = "desc",
                Limit = 1,
                CursorCreatedUtc = newest,
                CursorId = "cmp-cursor-newest\n",
            },
            CancellationToken.None);

        page.Records.Should().ContainSingle();
        page.Records[0].ComparisonRecordId.Should().Be("cmp-cursor-middle");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_offset_paging_uses_trimmed_comparison_record_id_tiebreaker()
    {
        DateTime sharedTime = new(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);

        InMemoryComparisonRecordRepository comparisonRecords = new();
        FieldInfo? itemsField = typeof(InMemoryComparisonRecordRepository).GetField(
            "_items",
            BindingFlags.Instance | BindingFlags.NonPublic);
        itemsField.Should().NotBeNull();
        List<ComparisonRecord> items = (List<ComparisonRecord>)itemsField!.GetValue(comparisonRecords)!;
        items.Add(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-offset-a",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = sharedTime,
            });
        items.Add(
            new ComparisonRecord
            {
                ComparisonRecordId = "  cmp-offset-b  ",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = sharedTime,
            });

        ComparisonsApplicationService sut = new(
            new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonHistorySearchResult page = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria
            {
                SortBy = "createdUtc",
                SortDir = "desc",
                Skip = 0,
                Limit = 1,
            },
            CancellationToken.None);

        page.Records.Should().ContainSingle();
        page.Records[0].ComparisonRecordId.Should().Be("cmp-offset-b");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_sorts_ascending_when_sort_dir_has_surrounding_whitespace()
    {
        DateTime oldest = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime middle = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime newest = new(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc);

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-sort-oldest",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = newest,
            },
            CancellationToken.None);
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-sort-middle",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = oldest,
            },
            CancellationToken.None);
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-sort-newest",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = middle,
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
            new ComparisonHistorySearchCriteria
            {
                SortBy = "createdUtc",
                SortDir = " asc ",
                Limit = 10,
            },
            CancellationToken.None);

        result.Records.Select(r => r.ComparisonRecordId)
            .Should()
            .Equal("cmp-sort-middle", "cmp-sort-newest", "cmp-sort-oldest");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_passes_trimmed_right_export_record_filters_to_repository_cursor_path()
    {
        const string exportRecordId = "trim-right-export";

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.SearchByCursorAsync(
                null,
                null,
                null,
                null,
                null,
                null,
                exportRecordId,
                null,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                10,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ComparisonsApplicationService sut = new(
            new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        await sut.SearchAsync(
            new ComparisonHistorySearchCriteria
            {
                RightExportRecordId = $"  {exportRecordId}  ",
                UseCursorPaging = true,
                Limit = 10,
            },
            CancellationToken.None);

        comparisonRecords.Verify(
            r => r.SearchByCursorAsync(
                null,
                null,
                null,
                null,
                null,
                null,
                exportRecordId,
                null,
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                10,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_stored_comparison_type_has_legacy_casing()
    {
        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-stored-type-casing",
                ComparisonType = "  END-TO-END-REPLAY  ",
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
            new ComparisonHistorySearchCriteria
            {
                ComparisonType = ComparisonTypes.EndToEndReplay,
                Limit = 10,
            },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-stored-type-casing");
        result.Records[0].ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_comparison_type_filter_has_legacy_casing()
    {
        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-type-casing",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
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
            new ComparisonHistorySearchCriteria { ComparisonType = "  END-TO-END-REPLAY  ", Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-type-casing");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_tag_filter_differs_only_by_casing()
    {
        const string storedTag = "Release-Alpha";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-tag-casing",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Tags = [storedTag],
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
            new ComparisonHistorySearchCriteria { Tags = ["release-alpha"], Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-tag-casing");
        result.Records[0].Tags.Should().ContainSingle(t => t == storedTag);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_tag_filter_has_trailing_whitespace()
    {
        const string tag = "release-alpha";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-tag-trim",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Tags = [tag],
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
            new ComparisonHistorySearchCriteria { Tags = [$"  {tag}\n"], Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-tag-trim");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_label_filter_differs_only_by_casing()
    {
        const string storedLabel = "Release-Candidate";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-label-casing",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Label = storedLabel,
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
            new ComparisonHistorySearchCriteria { Label = "release-candidate", Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-label-casing");
        result.Records[0].Label.Should().Be(storedLabel);
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_label_filter_has_trailing_whitespace()
    {
        const string label = "release-1";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-label-trim",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                Label = label,
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
            new ComparisonHistorySearchCriteria { Label = $"  {label}\n", Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-label-trim");
    }

    [Fact]
    public async Task CompareQuality_SearchAsync_finds_records_when_left_run_filter_has_trailing_line_break()
    {
        const string leftRunId = "legacy-compare-left-run-id";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-trim-left",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = leftRunId,
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
            new ComparisonHistorySearchCriteria { LeftRunId = $"{leftRunId}\n", Limit = 10 },
            CancellationToken.None);

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-trim-left");
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
    public async Task CompareQuality_SearchAsync_finds_records_when_left_run_filter_uses_dashed_guid_and_persisted_left_uses_dashed_format()
    {
        Guid leftKey = Guid.Parse("77777777-7777-7777-7777-777777777777");
        string canonicalLeftRunId = leftKey.ToString("N");
        string dashedLeftRunId = leftKey.ToString("D");

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = "cmp-search-left-dashed-stored",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = dashedLeftRunId,
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

        result.Records.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-left-dashed-stored");
        result.Records[0].LeftRunId.Should().Be(canonicalLeftRunId);
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
            .Setup(s => s.GetRunDetailAsync(canonicalLeftRunId, It.IsAny<CancellationToken>()))
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
    public async Task CompareQuality_TryUpdateLabelAndTagsAsync_dedupes_tags_that_differ_only_by_casing()
    {
        const string comparisonRecordId = "cmp-update-tag-dedupe";
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "ffffffffffffffffffffffffffffffff",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? updated = await sut.TryUpdateLabelAndTagsAsync(
            comparisonRecordId,
            label: null,
            tags: ["release-alpha", "Release-Alpha", "beta"],
            CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.Tags.Should().Equal("release-alpha", "beta");

        ComparisonHistorySearchResult search = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria { Tags = ["RELEASE-ALPHA"], Limit = 10 },
            CancellationToken.None);

        search.Records.Should().ContainSingle(r => r.ComparisonRecordId == comparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryUpdateLabelAndTagsAsync_trims_label_and_tags_on_persist()
    {
        const string comparisonRecordId = "cmp-update-trim";
        const string runId = "cccccccccccccccccccccccccccccccc";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "dddddddddddddddddddddddddddddddd",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? updated = await sut.TryUpdateLabelAndTagsAsync(
            comparisonRecordId,
            label: "  release-1  ",
            tags: ["  alpha\n", " "],
            CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.Label.Should().Be("release-1");
        updated.Tags.Should().Equal(["alpha"]);

        ComparisonHistorySearchResult search = await sut.SearchAsync(
            new ComparisonHistorySearchCriteria { Tags = ["alpha"], Limit = 10 },
            CancellationToken.None);

        search.Records.Should().ContainSingle(r => r.ComparisonRecordId == comparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryBuildBatchReplayZipAsync_dedupes_ids_that_differ_only_by_trailing_whitespace()
    {
        const string comparisonRecordId = "cmp-batch-dedupe";
        const string runId = "dddddddddddddddddddddddddddddddd";

        Mock<IComparisonRecordRepository> comparisons = new();
        comparisons
            .Setup(r => r.GetByIdAsync(comparisonRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ComparisonRecord
                {
                    ComparisonRecordId = comparisonRecordId,
                    LeftRunId = runId,
                    ComparisonType = ComparisonTypes.ExportRecordDiff,
                    SummaryMarkdown = "## ok",
                    CreatedUtc = DateTime.UtcNow,
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.ReplayAsync(It.IsAny<ReplayComparisonRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ReplayComparisonResult
                {
                    ComparisonRecordId = comparisonRecordId,
                    ComparisonType = ComparisonTypes.ExportRecordDiff,
                    Format = "markdown",
                    Content = "# replay",
                });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisons.Object,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        await sut.TryBuildBatchReplayZipAsync(
            [$"{comparisonRecordId}\n", comparisonRecordId],
            format: "markdown",
            replayMode: "artifact",
            profile: null,
            persistReplay: false,
            CancellationToken.None);

        replay.Verify(
            r => r.ReplayAsync(
                It.Is<ReplayComparisonRequest>(req => req.ComparisonRecordId == comparisonRecordId),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
    public async Task CompareQuality_TryReplaySummaryMarkdownAsync_trims_comparison_record_id_on_stored_summary_fast_path()
    {
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        const string canonicalComparisonRecordId = "cmp-stored-summary";
        ComparisonRecord record = new()
        {
            ComparisonRecordId = $"  {canonicalComparisonRecordId}  ",
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = runId,
            RightRunId = "cccccccccccccccccccccccccccccccc",
            SummaryMarkdown = "## Stored summary",
            CreatedUtc = DateTime.UtcNow,
        };
        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByIdAsync(canonicalComparisonRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        Mock<IComparisonReplayService> replay = new();
        replay
            .Setup(s => s.EnsureArtifactReplayAccessAllowedAsync(record, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            replay.Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ReplayComparisonResult? result = await sut.TryReplaySummaryMarkdownAsync(canonicalComparisonRecordId, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
        result.FileName.Should().Be($"comparison_{canonicalComparisonRecordId}.md");
        result.Content.Should().Be("## Stored summary");
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

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_finds_legacy_padded_comparison_record_id_in_repository()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string canonicalComparisonRecordId = "cmp-scoped-legacy-pad";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        FieldInfo? itemsField = typeof(InMemoryComparisonRecordRepository).GetField(
            "_items",
            BindingFlags.Instance | BindingFlags.NonPublic);
        itemsField.Should().NotBeNull();
        List<ComparisonRecord> items = (List<ComparisonRecord>)itemsField!.GetValue(comparisonRecords)!;
        items.Add(
            new ComparisonRecord
            {
                ComparisonRecordId = $"  {canonicalComparisonRecordId}  ",
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = DateTime.UtcNow,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(canonicalComparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_trims_padded_manifest_versions_from_stored_row()
    {
        const string runId = "cccccccccccccccccccccccccccccccc";
        const string comparisonRecordId = "cmp-scoped-manifest-pad";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        FieldInfo? itemsField = typeof(InMemoryComparisonRecordRepository).GetField(
            "_items",
            BindingFlags.Instance | BindingFlags.NonPublic);
        itemsField.Should().NotBeNull();
        List<ComparisonRecord> items = (List<ComparisonRecord>)itemsField!.GetValue(comparisonRecords)!;
        items.Add(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = runId,
                RightRunId = "dddddddddddddddddddddddddddddddd",
                LeftManifestVersion = "  left-v  ",
                RightManifestVersion = "  right-v  ",
                CreatedUtc = DateTime.UtcNow,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(comparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.LeftManifestVersion.Should().Be("left-v");
        scoped.RightManifestVersion.Should().Be("right-v");
    }

    [Fact]
    public async Task CompareQuality_TryGetScopedRecordAsync_trims_padded_label_type_tags_and_summary_from_repository_row()
    {
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const string comparisonRecordId = "cmp-scoped-text-pad";

        Mock<IComparisonRecordRepository> comparisonRecords = new();
        comparisonRecords
            .Setup(r => r.GetByIdAsync(comparisonRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ComparisonRecord
                {
                    ComparisonRecordId = comparisonRecordId,
                    ComparisonType = "  end-to-end-replay  ",
                    LeftRunId = runId,
                    RightRunId = "ffffffffffffffffffffffffffffffff",
                    Label = "  release-1  ",
                    Tags = ["  alpha  "],
                    SummaryMarkdown = "  # summary  ",
                    CreatedUtc = DateTime.UtcNow,
                });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = runId } });

        ComparisonsApplicationService sut = new(
            runDetail.Object,
            new Mock<IRunExportRecordRepository>().Object,
            comparisonRecords.Object,
            new Mock<IComparisonReplayService>().Object,
            new Mock<ICompareRunsApplicationFacade>().Object,
            new Mock<IComparisonReplayCostEstimator>().Object,
            new Mock<IDriftReportFormatter>().Object,
            new DriftReportDocxExport());

        ComparisonRecord? scoped =
            await sut.TryGetScopedRecordAsync(comparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.ComparisonType.Should().Be(ComparisonTypes.EndToEndReplay);
        scoped.Label.Should().Be("release-1");
        scoped.Tags.Should().BeEquivalentTo("alpha");
        scoped.SummaryMarkdown.Should().Be("# summary");
    }

    [Fact]
    public async Task CompareQuality_in_memory_comparison_repository_create_canonicalizes_dashed_left_run_id()
    {
        Guid leftKey = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string canonicalLeftRunId = leftKey.ToString("N");
        const string comparisonRecordId = "cmp-inmem-create-canonical";

        InMemoryComparisonRecordRepository comparisonRecords = new();
        await comparisonRecords.CreateAsync(
            new ComparisonRecord
            {
                ComparisonRecordId = comparisonRecordId,
                ComparisonType = ComparisonTypes.EndToEndReplay,
                LeftRunId = leftKey.ToString("D"),
                RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalLeftRunId, It.IsAny<CancellationToken>()))
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

        ComparisonRecord? scoped = await sut.TryGetScopedRecordAsync(comparisonRecordId, CancellationToken.None);

        scoped.Should().NotBeNull();
        scoped!.LeftRunId.Should().Be(canonicalLeftRunId);
    }

    [Fact]
    public async Task CompareQuality_in_memory_export_repository_get_by_id_canonicalizes_dashed_compare_run_id()
    {
        const string exportId = "exp-repo-dashed-compare";
        Guid runGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Guid compareGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");

        InMemoryRunExportRecordRepository repository = new();
        RunExportRecord legacy = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("D"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "report.md",
            CompareRunId = compareGuid.ToString("D"),
            CreatedUtc = DateTime.UtcNow,
        };

        FieldInfo? byExportIdField = typeof(InMemoryRunExportRecordRepository).GetField(
            "_byExportId",
            BindingFlags.Instance | BindingFlags.NonPublic);
        byExportIdField.Should().NotBeNull();
        Dictionary<string, RunExportRecord> byExportId =
            (Dictionary<string, RunExportRecord>)byExportIdField!.GetValue(repository)!;
        byExportId[exportId] = legacy;

        RunExportRecord? loaded = await repository.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.RunId.Should().Be(runGuid.ToString("N"));
        loaded.CompareRunId.Should().Be(compareGuid.ToString("N"));
    }
}
