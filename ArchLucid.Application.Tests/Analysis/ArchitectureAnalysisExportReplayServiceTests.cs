using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ArchitectureAnalysisExportReplayServiceTests
{
    private static readonly JsonSerializerOptions PersistJsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task ArchitectureAnalysis_export_replay_applies_career_gate_when_record_run_id_uses_dashed_guid_format()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string canonicalRunId = runGuid.ToString("N");
        string dashedRunId = runGuid.ToString("D");

        Mock<IRunExportRecordRepository> repo = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        Mock<IRunDetailQueryService> runDetails = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = dashedRunId,
            ExportType = "analysis-report-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(
                new PersistedAnalysisExportRequest
                {
                    IncludeEvidence = false,
                    IncludeExecutionTraces = false,
                    IncludeManifest = true,
                    IncludeDiagram = false,
                    IncludeSummary = true,
                },
                PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IAuthorityQueryService> authority = new();
        ManifestDocument goldenManifest =
            SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);
        SealedExportReceiptTestSupport.ConfigureSampleRunExportDetail(authority, runGuid, goldenManifest);

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
            .Setup(r => r.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = canonicalRunId,
                    Status = ArchitectureRunStatus.Committed,
                },
                Manifest = new GoldenManifest { RunId = canonicalRunId, SystemName = "Sample" },
                HasBrokenManifestReference = false,
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });

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

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            Mock.Of<IArchitectureAnalysisConsultingDocxExportService>(),
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            runDetails.Object,
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            configuration,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        Func<Task> act = async () =>
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        await act.Should().ThrowAsync<CareerArtifactExportBlockedException>();
        runDetails.Verify(
            r => r.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.Once);
        analysis.Verify(
            a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReplayAsync_trims_stored_run_id_before_build_request()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string canonicalRunId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> repo = new();
        ArchitectureAnalysisRequest? capturedRequest = null;
        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureAnalysisRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1, 2, 3]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = $"  {canonicalRunId}  ",
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeEvidence = false,
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        result.RunId.Should().Be(canonicalRunId);
        capturedRequest.Should().NotBeNull();
        capturedRequest!.RunId.Should().Be(canonicalRunId);
    }

    [Fact]
    public async Task ReplayAsync_trims_padded_export_record_id_on_replay_result()
    {
        const string canonicalExportRecordId = "export-replay-trim-id";
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string canonicalRunId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord record = new()
        {
            ExportRecordId = $"  {canonicalExportRecordId}  ",
            RunId = canonicalRunId,
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeEvidence = false,
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(canonicalExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1, 2, 3]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = canonicalExportRecordId });

        result.ExportRecordId.Should().Be(canonicalExportRecordId);
    }

    [Fact]
    public async Task ReplayAsync_trims_padded_recorded_replay_export_record_id_when_persisting_replay()
    {
        const string canonicalExportRecordId = "export-source-replay-persist";
        const string canonicalRecordedExportRecordId = "export-recorded-replay-row";
        Guid runGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string canonicalRunId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> repo = new();
        RunExportRecord record = new()
        {
            ExportRecordId = canonicalExportRecordId,
            RunId = canonicalRunId,
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeEvidence = false,
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(canonicalExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1, 2, 3]);

        Mock<IRunExportAuditService> exportAudit = new();
        exportAudit
            .Setup(a => a.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<PersistedAnalysisExportRequest?>(),
                It.IsAny<string?>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExportRecord
            {
                ExportRecordId = $"  {canonicalRecordedExportRecordId}  ",
                RunId = canonicalRunId,
            });

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            exportAudit.Object,
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        ReplayExportResult result = await sut.ReplayAsync(
            new ReplayExportRequest
            {
                ExportRecordId = canonicalExportRecordId,
                RecordReplayExport = true,
            });

        result.RecordedReplayExportRecordId.Should().Be(canonicalRecordedExportRecordId);
    }

    [Fact]
    public async Task ReplayAsync_canonicalizes_stored_dashed_padded_run_id_before_build_request()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = runGuid.ToString("N");
        string dashedPaddedRunId = $"{runGuid:D}  ";

        Mock<IRunExportRecordRepository> repo = new();
        ArchitectureAnalysisRequest? capturedRequest = null;
        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureAnalysisRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1, 2, 3]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = dashedPaddedRunId,
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeEvidence = false,
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        result.RunId.Should().Be(canonicalRunId);
        capturedRequest.Should().NotBeNull();
        capturedRequest!.RunId.Should().Be(canonicalRunId);
    }

    [Fact]
    public async Task ReplayAsync_clears_stale_denormalized_determinism_iterations_on_loaded_record()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string canonicalRunId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> repo = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = canonicalRunId,
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            IncludedDeterminismCheck = false,
            DeterminismIterations = 4,
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        record.DeterminismIterations.Should().BeNull();
    }

    [Fact]
    public async Task ReplayAsync_succeeds_when_export_type_has_surrounding_whitespace()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        string canonicalRunId = runGuid.ToString("N");

        Mock<IRunExportRecordRepository> repo = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([9, 8, 7]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = canonicalRunId,
            ExportType = "  analysis-report-consulting-docx  ",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeManifest = true,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        ReplayExportResult result =
            await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        result.ExportType.Should().Be("analysis-report-consulting-docx");
        result.Content.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ReplayAsync_trims_padded_compare_run_id_from_rehydrated_analysis_request()
    {
        Guid runGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string canonicalRunId = runGuid.ToString("N");
        const string compareRunId = "cccccccccccccccccccccccccccccccc";

        Mock<IRunExportRecordRepository> repo = new();
        ArchitectureAnalysisRequest? capturedRequest = null;
        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ArchitectureAnalysisRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new ArchitectureAnalysisReport());

        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        consultingDocx
            .Setup(c => c.GenerateDocxAsync(
                It.IsAny<ArchitectureAnalysisReport>(),
                It.IsAny<ConsultingDocxExportBranding?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([1]);

        Mock<IAuthorityQueryService> authority = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();
        SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runGuid, manifestHashService);

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = canonicalRunId,
            ExportType = "analysis-report-consulting-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeManifest = true,
                IncludeSummary = true,
                IncludeAgentResultCompare = true,
                CompareRunId = $"  {compareRunId}  ",
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        ExportReplayService sut = new(
            repo.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            consultingDocx.Object,
            Mock.Of<IRunExportAuditService>(),
            authority.Object,
            manifestHashService,
            scopeProvider.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            SealedExportReceiptTestSupport.CreateEmptyAgentExecutionTraceRepository(),
            SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<ArchLucid.Core.Persistence.ApplicationPorts.Architecture.IArchitectureInventoryBindingRepository>());

        await sut.ReplayAsync(new ReplayExportRequest { ExportRecordId = record.ExportRecordId });

        capturedRequest.Should().NotBeNull();
        capturedRequest!.CompareRunId.Should().Be(compareRunId);
    }
}
