using ArchLucid.Application;
using ArchLucid.Application.Analysis;
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

    private static RunExportQueryFacade CreateFacade(
        Mock<IRunDetailQueryService> runDetails,
        Mock<IRunExportRecordRepository>? exportRecords = null,
        Mock<IAuthorityQueryService>? authority = null,
        IManifestHashService? manifestHashService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        return new RunExportQueryFacade(
            runDetails.Object,
            (exportRecords ?? new Mock<IRunExportRecordRepository>()).Object,
            Mock.Of<IComparisonAuditService>(),
            Mock.Of<IExportReplayService>(),
            Mock.Of<IExportRecordDiffService>(),
            Mock.Of<IExportRecordDiffSummaryFormatter>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IRunExportLineageVerifier>(),
            (authority ?? new Mock<IAuthorityQueryService>()).Object,
            manifestHashService ?? Mock.Of<IManifestHashService>(),
            scopeProvider.Object);
    }

    private static RunExportQueryFacade CreateFacade(Mock<IRunDetailQueryService> runDetails) =>
        CreateFacade(runDetails, null, null, null);

    private static RunExportRecord CreateExportRecord() =>
        new()
        {
            ExportRecordId = ExportRecordId,
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
}
