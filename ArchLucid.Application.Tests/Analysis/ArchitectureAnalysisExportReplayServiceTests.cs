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
}
