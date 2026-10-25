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
