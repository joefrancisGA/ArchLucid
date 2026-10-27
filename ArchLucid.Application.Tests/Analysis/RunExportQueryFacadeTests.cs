using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportQueryFacadeTests
{
    private const string RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private const string ExportRecordId = "export-record-id";

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_succeeds_when_run_id_differs_only_by_casing()
    {
        const string uppercaseRunId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([export]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(uppercaseRunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().ContainSingle(e => e.ExportRecordId == ExportRecordId);
        runDetails.Verify(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
        exportRecords.Verify(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_finds_exports_when_repository_matches_only_alternate_run_id_key()
    {
        Guid runGuid = Guid.Parse(RunId);
        string legacyUpperRunId = RunId.ToUpperInvariant();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([export]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().ContainSingle(e => e.ExportRecordId == ExportRecordId);
        exportRecords.Verify(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_merges_exports_when_rows_are_split_across_alternate_run_id_keys()
    {
        Guid runGuid = Guid.Parse(RunId);
        string legacyUpperRunId = RunId.ToUpperInvariant();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord canonicalKeyed = CreateExportRecord();
        RunExportRecord legacyKeyed = new()
        {
            ExportRecordId = "export-legacy-run-key",
            RunId = legacyUpperRunId,
            ExportType = "analysis-report",
            Format = "pdf",
            FileName = "legacy.pdf",
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([canonicalKeyed, legacyKeyed]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().Contain(e => e.ExportRecordId == ExportRecordId);
        result.Exports.Should().Contain(e => e.ExportRecordId == "export-legacy-run-key");
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_orders_merged_exports_by_created_utc_descending()
    {
        Guid runGuid = Guid.Parse(RunId);
        string legacyUpperRunId = RunId.ToUpperInvariant();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord older = new()
        {
            ExportRecordId = "export-older-canonical-key",
            RunId = RunId,
            ExportType = "analysis-report",
            Format = "pdf",
            FileName = "older.pdf",
            CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
        };
        RunExportRecord newer = new()
        {
            ExportRecordId = "export-newer-legacy-key",
            RunId = legacyUpperRunId,
            ExportType = "analysis-report",
            Format = "pdf",
            FileName = "newer.pdf",
            CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([newer, older]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().HaveCount(2);
        result.Exports![0].ExportRecordId.Should().Be("export-newer-legacy-key");
        result.Exports[1].ExportRecordId.Should().Be("export-older-canonical-key");
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_trims_padded_run_id_before_history_load()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([export]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync($"  {RunId}  ", CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().ContainSingle(e => e.ExportRecordId == ExportRecordId);
        result.MissingRunId.Should().BeNull();
        exportRecords.Verify(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
        runDetails.Verify(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_trims_padded_export_record_id_from_list_rows()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();
        export.ExportRecordId = $"  {ExportRecordId}  ";

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([export]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Exports.Should().ContainSingle();
        result.Exports![0].ExportRecordId.Should().Be(ExportRecordId);
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_trims_padded_export_record_id_from_stored_row()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();
        export.ExportRecordId = $"  {ExportRecordId}  ";

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(export);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.ExportRecordId.Should().Be(ExportRecordId);
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_succeeds_when_export_id_differs_only_by_casing()
    {
        const string storedExportId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string lookupExportId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        InMemoryRunExportRecordRepository inMemoryExports = new();
        await inMemoryExports.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = storedExportId,
                RunId = RunId,
                ExportType = "analysis-report-docx",
                Format = "docx",
                FileName = "report.docx",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((id, ct) => inMemoryExports.GetByIdAsync(id, ct));

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(lookupExportId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.ExportRecordId.Should().Be(storedExportId);
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_canonicalizes_dashed_compare_run_id_from_stored_row()
    {
        Guid compareRunGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string canonicalCompareRunId = compareRunGuid.ToString("N");
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);
        RunExportRecord export = CreateExportRecord();
        export.CompareRunId = compareRunGuid.ToString("D");
        export.CompareManifestVersion = "  v2  ";

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(export);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.CompareRunId.Should().Be(canonicalCompareRunId);
        result.Record.CompareManifestVersion.Should().Be("v2");
    }

    [Fact]
    public async Task GetRunExportHistoryAsync_returns_run_not_found_for_whitespace_run_id_without_calling_detail_query()
    {
        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Value cannot be null or whitespace.", "runId"));

        RunExportQueryFacade sut = CreateFacade(runDetails);

        RunExportHistoryQueryResult result = await sut.GetRunExportHistoryAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.RunNotFound);
        result.MissingRunId.Should().Be("   ");
        runDetails.Verify(
            r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetRunExportHistoryAsync_returns_lineage_unverified_when_authority_lifecycle_not_complete()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithInProgressLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateExportRecord()]);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.LineageUnverified);
        result.MissingRunId.Should().Be(RunId);
        result.Exports.Should().BeNull();
        exportRecords.Verify(
            r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_returns_lineage_unverified_when_sealed_manifest_hash_mismatches()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateExportRecord()]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        ManifestDocument goldenManifest =
            SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        goldenManifest.ManifestHash = "DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF";
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        RunExportHistoryQueryResult result =
            await sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.LineageUnverified);
        result.MissingRunId.Should().Be(RunId);
        result.Exports.Should().BeNull();
        exportRecords.Verify(
            r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_GetRunExportHistoryAsync_throws_when_career_posture_blocks_metadata_read()
    {
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByRunIdAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateExportRecord()]);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(runGuid, It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService,
            careerGate);

        Func<Task> act = () => sut.GetRunExportHistoryAsync(RunId, CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        exportRecords.Verify(
            r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetExportRecordAsync_throws_when_career_posture_blocks_metadata_read()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(runGuid, It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService,
            careerGate);

        Func<Task> act = () => sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_loads_record_when_stored_run_id_has_surrounding_whitespace()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        record.RunId = $"  {RunId}  ";
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.RunId.Should().Be(RunId);
        runDetails.Verify(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_loads_record_when_stored_run_id_is_dashed_guid_with_padding()
    {
        Guid runGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string canonicalRunId = runGuid.ToString("N");
        string dashedPaddedRunId = $"{runGuid:D}  ";

        RunExportRecord record = CreateExportRecord();
        record.RunId = dashedPaddedRunId;
        ArchitectureRunDetail scopedDetail = new()
        {
            Run = new() { RunId = canonicalRunId },
        };
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.RunId.Should().Be(canonicalRunId);
        runDetails.Verify(
            r => r.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_trims_padded_template_profile_from_stored_row()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        record.TemplateProfile = "  sponsor  ";
        record.TemplateProfileDisplayName = "  Sponsor pack  ";
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.TemplateProfile.Should().Be("sponsor");
        result.Record.TemplateProfileDisplayName.Should().Be("Sponsor pack");
    }

    [Fact]
    public async Task CompareQuality_GetExportRecordAsync_trims_padded_export_record_id_before_lookup()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);
        exportRecords
            .Setup(r => r.GetByIdAsync(It.Is<string>(id => id != ExportRecordId), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportRecord?)null);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync($"  {ExportRecordId}  ", CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.ExportRecordId.Should().Be(ExportRecordId);
        exportRecords.Verify(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetExportRecordAsync_clears_stale_denormalized_determinism_iterations_when_check_disabled()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        record.IncludedDeterminismCheck = false;
        record.DeterminismIterations = 4;
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(runDetails, exportRecords, authority, manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Record!.DeterminismIterations.Should().BeNull();
    }

    [Fact]
    public async Task CompareExportRecordsAsync_passes_normalized_denormalized_determinism_columns_to_diff()
    {
        const string leftExportRecordId = "left-export";
        const string rightExportRecordId = "right-export";
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord leftRecord = CreateExportRecord(leftExportRecordId);
        leftRecord.IncludedDeterminismCheck = false;
        leftRecord.DeterminismIterations = 5;
        RunExportRecord rightRecord = CreateExportRecord(rightExportRecordId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(leftExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(leftRecord);
        exportRecords
            .Setup(r => r.GetByIdAsync(rightExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rightRecord);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportRecord? capturedLeft = null;
        RunExportRecord? capturedRight = null;
        Mock<IExportRecordDiffService> diffService = new();
        diffService
            .Setup(d => d.CompareAsync(It.IsAny<RunExportRecord>(), It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .Callback<RunExportRecord, RunExportRecord, CancellationToken>((left, right, _) =>
            {
                capturedLeft = left;
                capturedRight = right;
            })
            .ReturnsAsync(new ExportRecordDiffResult());

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService,
            exportRecordDiffService: diffService);

        ExportRecordDiffQueryResult result =
            await sut.CompareExportRecordsAsync(leftExportRecordId, rightExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        capturedLeft.Should().NotBeNull();
        capturedLeft!.DeterminismIterations.Should().BeNull();
        capturedRight!.DeterminismIterations.Should().BeNull();
    }

    [Fact]
    public async Task CompareQuality_CompareExportRecordsSummaryAsync_audit_json_trims_padded_export_record_ids()
    {
        const string leftExportRecordId = "left-export";
        const string rightExportRecordId = "right-export";
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord leftRecord = CreateExportRecord(leftExportRecordId);
        RunExportRecord rightRecord = CreateExportRecord(rightExportRecordId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(leftExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(leftRecord);
        exportRecords
            .Setup(r => r.GetByIdAsync(rightExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rightRecord);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IExportRecordDiffService> diffService = new();
        diffService
            .Setup(d => d.CompareAsync(It.IsAny<RunExportRecord>(), It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExportRecordDiffResult());

        Mock<IExportRecordDiffSummaryFormatter> formatter = new();
        formatter
            .Setup(f => f.FormatMarkdown(It.IsAny<ExportRecordDiffResult>()))
            .Returns("# diff");

        Mock<IComparisonAuditService> comparisonAudit = new();
        comparisonAudit
            .Setup(c => c.RecordExportDiffAsync(It.IsAny<ExportRecordDiffResult>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("cmp-summary-audit");

        AuditEvent? capturedAudit = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => capturedAudit = evt)
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        RunExportQueryFacade sut = new(
            runDetails.Object,
            exportRecords.Object,
            comparisonAudit.Object,
            Mock.Of<IExportReplayService>(),
            diffService.Object,
            formatter.Object,
            audit.Object,
            Mock.Of<IRunExportLineageVerifier>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunExportCareerPostureGate>());

        ExportRecordDiffSummaryQueryResult result = await sut.CompareExportRecordsSummaryAsync(
            $"  {leftExportRecordId}  ",
            $"  {rightExportRecordId}  ",
            persist: true,
            CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        capturedAudit.Should().NotBeNull();
        capturedAudit!.DataJson.Should().Contain(leftExportRecordId);
        capturedAudit.DataJson.Should().Contain(rightExportRecordId);
        capturedAudit.DataJson.Should().NotContain($"  {leftExportRecordId}  ");
    }

    [Fact]
    public async Task CompareExportRecordsAsync_throws_when_career_posture_blocks_metadata_read()
    {
        const string leftExportRecordId = "left-export";
        const string rightExportRecordId = "right-export";
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord leftRecord = CreateExportRecord(leftExportRecordId);
        RunExportRecord rightRecord = CreateExportRecord(rightExportRecordId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(leftExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(leftRecord);
        exportRecords
            .Setup(r => r.GetByIdAsync(rightExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rightRecord);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(runGuid, It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        Mock<IExportRecordDiffService> diffService = new();

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService,
            careerGate,
            diffService);

        Func<Task> act = () =>
            sut.CompareExportRecordsAsync(leftExportRecordId, rightExportRecordId, CancellationToken.None);

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        diffService.Verify(
            d => d.CompareAsync(It.IsAny<RunExportRecord>(), It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetExportRecordAsync_returns_lineage_unverified_when_authority_lifecycle_not_complete()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithInProgressLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService);

        ScopedExportRecordLoadResult result =
            await sut.GetExportRecordAsync(ExportRecordId, CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.LineageUnverified);
        result.MissingId.Should().Be(RunId);
        result.Record.Should().BeNull();
    }

    [Fact]
    public async Task CompareQuality_ReplayExportAsync_trims_padded_replay_result_and_audit_json_when_record_replay_export()
    {
        const string canonicalSourceExportId = "source-export-replay-audit";
        const string canonicalRecordedExportId = "recorded-export-replay-audit";
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(canonicalSourceExportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateExportRecord(canonicalSourceExportId));

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IExportReplayService> exportReplay = new();
        exportReplay
            .Setup(r => r.ReplayAsync(It.IsAny<ReplayExportRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplayExportResult
            {
                ExportRecordId = $"  {canonicalSourceExportId}  ",
                RecordedReplayExportRecordId = $"  {canonicalRecordedExportId}  ",
                RunId = RunId,
                Format = "docx",
                FileName = "replay.docx",
                Content = [],
            });

        AuditEvent? capturedAudit = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => capturedAudit = evt)
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        RunExportQueryFacade sut = new(
            runDetails.Object,
            exportRecords.Object,
            Mock.Of<IComparisonAuditService>(),
            exportReplay.Object,
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            audit.Object,
            Mock.Of<IRunExportLineageVerifier>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunExportCareerPostureGate>());

        ExportReplayQueryResult result = await sut.ReplayExportAsync(
            canonicalSourceExportId,
            new ReplayExportRequest { ExportRecordId = canonicalSourceExportId, RecordReplayExport = true },
            CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Replay!.ExportRecordId.Should().Be(canonicalSourceExportId);
        result.Replay.RecordedReplayExportRecordId.Should().Be(canonicalRecordedExportId);
        capturedAudit.Should().NotBeNull();
        capturedAudit!.DataJson.Should().Contain(canonicalSourceExportId);
        capturedAudit.DataJson.Should().Contain(canonicalRecordedExportId);
        capturedAudit.DataJson.Should().NotContain($"  {canonicalSourceExportId}  ");
    }

    [Fact]
    public async Task CompareQuality_ReplayExportAsync_trims_padded_export_type_format_and_template_on_replay_result()
    {
        const string canonicalSourceExportId = "source-export-replay-metadata";
        Guid runGuid = Guid.Parse(RunId);
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithCompleteLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(canonicalSourceExportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateExportRecord(canonicalSourceExportId));

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IExportReplayService> exportReplay = new();
        exportReplay
            .Setup(r => r.ReplayAsync(It.IsAny<ReplayExportRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplayExportResult
            {
                ExportRecordId = canonicalSourceExportId,
                RunId = RunId,
                ExportType = "  analysis-report-docx  ",
                Format = "  docx  ",
                FileName = "  replay.docx  ",
                TemplateProfile = "  sponsor  ",
                Content = [1],
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        RunExportQueryFacade sut = new(
            runDetails.Object,
            exportRecords.Object,
            Mock.Of<IComparisonAuditService>(),
            exportReplay.Object,
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IRunExportLineageVerifier>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunExportCareerPostureGate>());

        ExportReplayQueryResult result = await sut.ReplayExportAsync(
            canonicalSourceExportId,
            new ReplayExportRequest { ExportRecordId = canonicalSourceExportId },
            CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.Success);
        result.Replay!.ExportType.Should().Be("analysis-report-docx");
        result.Replay.Format.Should().Be("docx");
        result.Replay.FileName.Should().Be("replay.docx");
        result.Replay.TemplateProfile.Should().Be("sponsor");
    }

    [Fact]
    public async Task CompareQuality_ReplayExportAsync_returns_lineage_unverified_when_lifecycle_incomplete_before_career_gate()
    {
        Guid runGuid = Guid.Parse(RunId);
        RunExportRecord record = CreateExportRecord();
        ArchitectureRunDetail scopedDetail = CreateScopedRunDetail();
        RunDetailDto authorityDetail = CreateAuthorityDetailWithInProgressLifecycle(runGuid);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(r => r.GetRunDetailAsync(RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopedDetail);

        Mock<IRunExportRecordRepository> exportRecords = new();
        exportRecords
            .Setup(r => r.GetByIdAsync(ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IAuthorityQueryService> authority = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authorityDetail);

        Mock<IRunExportCareerPostureGate> careerGate = new();
        careerGate
            .Setup(g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                runGuid,
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        Mock<IExportReplayService> exportReplay = new();
        exportReplay
            .Setup(r => r.ReplayAsync(It.IsAny<ReplayExportRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplayExportResult { ExportRecordId = ExportRecordId, RunId = RunId });

        RunExportQueryFacade sut = CreateFacade(
            runDetails,
            exportRecords,
            authority,
            manifestHashService,
            careerGate,
            exportReplayService: exportReplay);

        ExportReplayQueryResult result = await sut.ReplayExportAsync(
            ExportRecordId,
            new ReplayExportRequest { ExportRecordId = ExportRecordId },
            CancellationToken.None);

        result.Outcome.Should().Be(ExportRecordLoadOutcome.LineageUnverified);
        result.MissingId.Should().Be(RunId);
        careerGate.Verify(
            g => g.EnsureAllowsExportRecordMetadataOrThrowAsync(
                It.IsAny<Guid>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        exportReplay.Verify(
            r => r.ReplayAsync(It.IsAny<ReplayExportRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunExportQueryFacade CreateFacade(
        Mock<IRunDetailQueryService> runDetails,
        Mock<IRunExportRecordRepository>? exportRecords = null,
        Mock<IAuthorityQueryService>? authority = null,
        IManifestHashService? manifestHashService = null,
        Mock<IRunExportCareerPostureGate>? careerGate = null,
        Mock<IExportRecordDiffService>? exportRecordDiffService = null,
        Mock<IExportReplayService>? exportReplayService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        return new RunExportQueryFacade(
            runDetails.Object,
            (exportRecords ?? new Mock<IRunExportRecordRepository>()).Object,
            Mock.Of<IComparisonAuditService>(),
            (exportReplayService ?? new Mock<IExportReplayService>()).Object,
            (exportRecordDiffService ?? new Mock<IExportRecordDiffService>()).Object,
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IRunExportLineageVerifier>(),
            (authority ?? new Mock<IAuthorityQueryService>()).Object,
            manifestHashService ?? Mock.Of<IManifestHashService>(),
            scopeProvider.Object,
            (careerGate ?? new Mock<IRunExportCareerPostureGate>()).Object);
    }

    private static RunExportQueryFacade CreateFacade(Mock<IRunDetailQueryService> runDetails) =>
        CreateFacade(runDetails, null, null, null);

    private static RunExportRecord CreateExportRecord(string? exportRecordId = null) =>
        new()
        {
            ExportRecordId = exportRecordId ?? ExportRecordId,
            RunId = RunId,
            ExportType = "analysis-report-docx",
            Format = "docx",
            FileName = "report.docx",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

    private static ArchitectureRunDetail CreateScopedRunDetail() =>
        new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1",
            },
            Manifest = new GoldenManifest
            {
                RunId = RunId,
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            },
            HasBrokenManifestReference = false,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
        };

    private static RunDetailDto CreateAuthorityDetailWithInProgressLifecycle(Guid runGuid) =>
        new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
                GoldenManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            },
        };

    private static RunDetailDto CreateAuthorityDetailWithCompleteLifecycle(Guid runGuid) =>
        new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                GoldenManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            },
            GoldenManifest = new ManifestDocument { ManifestHash = "abc123" },
        };
}
