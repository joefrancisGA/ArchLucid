using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     <see cref="ExportReplayService.ReplayAsync" /> contract: validation, rehydration failures, unsupported export
///     types,
///     and happy paths for <c>analysis-report-consulting-docx</c> vs <c>analysis-report-docx</c>.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ExportReplayServiceReplayAsyncTests
{
    private static readonly JsonSerializerOptions PersistJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    [SkippableFact]
    public async Task ReplayAsync_NullRequest_ThrowsArgumentNullException()
    {
        ExportReplayService sut = CreateSut(out _, out _, out _, out _, out _);

        Func<Task> act = async () => await sut.ReplayAsync(null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [SkippableFact]
    public async Task ReplayAsync_BlankExportRecordId_ThrowsArgumentException()
    {
        ExportReplayService sut = CreateSut(out _, out _, out _, out _, out _);

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = "   " });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task ReplayAsync_RecordNotFound_ThrowsInvalidOperationException()
    {
        ExportReplayService sut = CreateSut(out Mock<IRunExportRecordRepository> repo, out _, out _, out _, out _);
        repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportRecord?)null);

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = "missing" });

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("missing");
    }

    [SkippableFact]
    public async Task ReplayAsync_MissingAnalysisRequestJson_ThrowsInvalidOperationException()
    {
        ExportReplayService sut = CreateSut(out Mock<IRunExportRecordRepository> repo, out _, out _, out _, out _);
        RunExportRecord record = BaseRecord("analysis-report-consulting-docx");
        record.AnalysisRequestJson = null;
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("does not contain a persisted analysis request");
    }

    [SkippableFact]
    public async Task ReplayAsync_CorruptAnalysisRequestJson_ThrowsInvalidOperationException_WithJsonExceptionInner()
    {
        ExportReplayService sut = CreateSut(out Mock<IRunExportRecordRepository> repo, out _, out _, out _, out _);
        RunExportRecord record = BaseRecord("analysis-report-consulting-docx");
        record.AnalysisRequestJson = "{";
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        Exception ex = (await act.Should().ThrowAsync<InvalidOperationException>()).Which;
        ex.Message.Should().Contain("could not be deserialized");
        ex.InnerException.Should().BeOfType<JsonException>();
    }

    [SkippableFact]
    public async Task ReplayAsync_UnsupportedExportType_ThrowsInvalidOperationException()
    {
        ExportReplayService sut = CreateSut(out Mock<IRunExportRecordRepository> repo, out _, out _, out _, out _);
        RunExportRecord record = BaseRecord("ArchitectureAnalysis");
        record.AnalysisRequestJson = JsonSerializer.Serialize(MinimalPersistedRequest(), PersistJsonOptions);
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("Replay is not supported");
    }

    [SkippableFact]
    public async Task ReplayAsync_ConsultingDocx_UsesConsultingGenerator_NotStandardDocx()
    {
        ExportReplayService sut = CreateSut(
            out Mock<IRunExportRecordRepository> repo,
            out Mock<IArchitectureAnalysisService> analysis,
            out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
            out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
            out _);

        RunExportRecord record = BaseRecord("analysis-report-consulting-docx");
        record.AnalysisRequestJson = JsonSerializer.Serialize(MinimalPersistedRequest(), PersistJsonOptions);
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchitectureAnalysisReport built = new();
        analysis.Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(built);
        consultingDocx.Setup(c => c.GenerateDocxAsync(built, It.IsAny<ConsultingDocxExportBranding?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([1, 2, 3]);

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        result.Content.Should().Equal(1, 2, 3);
        result.FileName.Should().Be("base_replay.docx");
        consultingDocx.Verify(
            c => c.GenerateDocxAsync(built, It.IsAny<ConsultingDocxExportBranding?>(), It.IsAny<CancellationToken>()),
            Times.Once);
        standardDocx.Verify(
            s => s.GenerateDocxAsync(It.IsAny<ArchitectureAnalysisReport>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ReplayAsync_AnalysisDocx_UsesStandardGenerator_NotConsulting()
    {
        ExportReplayService sut = CreateSut(
            out Mock<IRunExportRecordRepository> repo,
            out Mock<IArchitectureAnalysisService> analysis,
            out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
            out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
            out _);

        RunExportRecord record = BaseRecord("analysis-report-docx");
        record.AnalysisRequestJson = JsonSerializer.Serialize(MinimalPersistedRequest(), PersistJsonOptions);
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchitectureAnalysisReport built = new();
        analysis.Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(built);
        standardDocx.Setup(s => s.GenerateDocxAsync(built, It.IsAny<CancellationToken>()))
            .ReturnsAsync([9]);

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        result.Content.Should().Equal("\t"u8.ToArray());
        standardDocx.Verify(
            s => s.GenerateDocxAsync(built, It.IsAny<CancellationToken>()),
            Times.Once);
        consultingDocx.Verify(
            c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ReplayAsync_WhenRecordReplayExportTrue_RecordsAuditOnce()
    {
        ExportReplayService sut = CreateSut(
            out Mock<IRunExportRecordRepository> repo,
            out Mock<IArchitectureAnalysisService> analysis,
            out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
            out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
            out Mock<IRunExportAuditService> audit);

        RunExportRecord record = BaseRecord("analysis-report-docx");
        record.AnalysisRequestJson = JsonSerializer.Serialize(MinimalPersistedRequest(), PersistJsonOptions);
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ArchitectureAnalysisReport built = new();
        analysis.Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(built);
        standardDocx.Setup(s => s.GenerateDocxAsync(built, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RunExportRecord persistedRow = new()
        {
            ExportRecordId = "persisted-replay-export-id",
            RunId = record.RunId,
            ExportType = record.ExportType,
            Format = record.Format,
            FileName = "x.docx",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        audit.Setup(a => a.RecordAsync(
                record.RunId,
                record.ExportType,
                record.Format,
                It.IsAny<string>(),
                record.TemplateProfile,
                record.TemplateProfileDisplayName,
                record.WasAutoSelected,
                record.ResolutionReason,
                It.IsAny<string?>(),
                It.IsAny<PersistedAnalysisExportRequest?>(),
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(persistedRow);

        ReplayExportResult replayResult = await sut.ReplayAsync(
            new ReplayExportRequest { ExportRecordId = record.ExportRecordId, RecordReplayExport = true });

        replayResult.RecordedReplayExportRecordId.Should().Be("persisted-replay-export-id");

        audit.Verify(
            a => a.RecordAsync(
                record.RunId,
                record.ExportType,
                record.Format,
                It.IsAny<string>(),
                record.TemplateProfile,
                record.TemplateProfileDisplayName,
                record.WasAutoSelected,
                record.ResolutionReason,
                It.IsAny<string?>(),
                It.IsAny<PersistedAnalysisExportRequest?>(),
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()),
            Times.Once);
        consultingDocx.Verify(
            c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ReplayAsync_sample_workspace_run_throws_career_blocked_before_regenerating_docx()
    {
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        Guid runGuid = Guid.Parse(runId);

        ExportReplayService sut = CreateSut(
            out Mock<IRunExportRecordRepository> repo,
            out Mock<IArchitectureAnalysisService> analysis,
            out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
            out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
            out _,
            out Mock<IAuthorityQueryService> authority,
            out ArchLucid.Decisioning.Services.ManifestHashService manifestHashService,
            out Mock<IRunDetailQueryService> runDetails);

        RunExportRecord record = BaseRecord("analysis-report-docx");
        record.RunId = runId;
        record.AnalysisRequestJson = JsonSerializer.Serialize(MinimalPersistedRequest(), PersistJsonOptions);
        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        ManifestDocument goldenManifest =
            ArchLucid.Application.Tests.Exports.SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(
                authority,
                runGuid,
                manifestHashService);
        ArchLucid.Application.Tests.Exports.SealedExportReceiptTestSupport.ConfigureSampleRunExportDetail(
            authority,
            runGuid,
            goldenManifest);

        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new ArchLucid.Persistence.Models.RunRecord
                {
                    RunId = runGuid,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                    GoldenManifestId = goldenManifest.ManifestId,
                },
                GoldenManifest = goldenManifest,
            });

        runDetails
            .Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = runId,
                    Status = ArchitectureRunStatus.Committed,
                },
                Manifest = new GoldenManifest { RunId = runId, SystemName = "Sample" },
                HasBrokenManifestReference = false,
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        CareerArtifactExportBlockedException exception =
            (await act.Should().ThrowAsync<CareerArtifactExportBlockedException>()).Which;

        exception.BlockReasonCode.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportCode);
        analysis.Verify(
            a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
        standardDocx.Verify(
            s => s.GenerateDocxAsync(It.IsAny<ArchitectureAnalysisReport>(), It.IsAny<CancellationToken>()),
            Times.Never);
        consultingDocx.Verify(
            c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ExportReplayService CreateSut(
        out Mock<IRunExportRecordRepository> repo,
        out Mock<IArchitectureAnalysisService> analysis,
        out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
        out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
        out Mock<IRunExportAuditService> audit)
    {
        repo = new Mock<IRunExportRecordRepository>();
        analysis = new Mock<IArchitectureAnalysisService>();
        standardDocx = new Mock<IArchitectureAnalysisDocxExportService>();
        consultingDocx = new Mock<IArchitectureAnalysisConsultingDocxExportService>();
        audit = new Mock<IRunExportAuditService>();

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        Mock<IRunDetailQueryService> runDetails = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        IConfiguration configuration =
            ArchLucid.Application.Tests.Exports.SealedExportReceiptTestSupport.CreateCareerExportHonestyConfiguration();

        return new ExportReplayService(
            repo.Object,
            analysis.Object,
            standardDocx.Object,
            consultingDocx.Object,
            audit.Object,
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            runDetails.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IGraphSnapshotRepository>(),
            ArchLucid.Application.Tests.Exports.SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            configuration);
    }

    private static ExportReplayService CreateSut(
        out Mock<IRunExportRecordRepository> repo,
        out Mock<IArchitectureAnalysisService> analysis,
        out Mock<IArchitectureAnalysisDocxExportService> standardDocx,
        out Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx,
        out Mock<IRunExportAuditService> audit,
        out Mock<IAuthorityQueryService> authority,
        out ArchLucid.Decisioning.Services.ManifestHashService manifestHashService,
        out Mock<IRunDetailQueryService> runDetails)
    {
        repo = new Mock<IRunExportRecordRepository>();
        analysis = new Mock<IArchitectureAnalysisService>();
        standardDocx = new Mock<IArchitectureAnalysisDocxExportService>();
        consultingDocx = new Mock<IArchitectureAnalysisConsultingDocxExportService>();
        audit = new Mock<IRunExportAuditService>();
        authority = new Mock<IAuthorityQueryService>();
        manifestHashService = new ArchLucid.Decisioning.Services.ManifestHashService();
        runDetails = new Mock<IRunDetailQueryService>();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{PreCommitGovernanceGateOptions.SectionPath}:{nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled)}"] = "true",
                [$"{AgentOutputQualityGateOptions.SectionPath}:{nameof(AgentOutputQualityGateOptions.Mode)}"] =
                    AgentOutputQualityGateMode.WarnOnly.ToString(),
                ["AgentExecution:Mode"] = "Simulator",
            })
            .Build();

        return new ExportReplayService(
            repo.Object,
            analysis.Object,
            standardDocx.Object,
            consultingDocx.Object,
            audit.Object,
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            runDetails.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IGraphSnapshotRepository>(),
            ArchLucid.Application.Tests.Exports.SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            configuration);
    }

    private static RunExportRecord BaseRecord(string exportType)
    {
        return new RunExportRecord
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = "run-replay-test",
            ExportType = exportType,
            Format = "docx",
            FileName = "base.docx",
            TemplateProfile = "sponsor",
            TemplateProfileDisplayName = "Sponsor",
            WasAutoSelected = false,
            ResolutionReason = "test",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    private static PersistedAnalysisExportRequest MinimalPersistedRequest()
    {
        return new PersistedAnalysisExportRequest
        {
            IncludeEvidence = false,
            IncludeExecutionTraces = false,
            IncludeManifest = true,
            IncludeDiagram = false,
            IncludeSummary = true,
            IncludeDeterminismCheck = false,
            DeterminismIterations = 0,
            IncludeManifestCompare = false,
            IncludeAgentResultCompare = false
        };
    }
}
