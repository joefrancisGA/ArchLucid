using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
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
public sealed class ExportReplayServiceCareerGateTests
{
    private static readonly JsonSerializerOptions PersistJsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task ReplayAsync_sample_workspace_run_throws_career_blocked_before_regenerating_docx()
    {
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunExportRecordRepository> repo = new();
        Mock<IArchitectureAnalysisService> analysis = new();
        Mock<IArchitectureAnalysisDocxExportService> standardDocx = new();
        Mock<IArchitectureAnalysisConsultingDocxExportService> consultingDocx = new();
        Mock<IAuthorityQueryService> authority = new();
        Mock<IRunDetailQueryService> runDetails = new();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            ExportType = "analysis-report-docx",
            Format = "docx",
            FileName = "base.docx",
            AnalysisRequestJson = JsonSerializer.Serialize(new PersistedAnalysisExportRequest
            {
                IncludeEvidence = false,
                IncludeExecutionTraces = false,
                IncludeManifest = true,
                IncludeDiagram = false,
                IncludeSummary = true,
            }, PersistJsonOptions),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        repo.Setup(r => r.GetByIdAsync(record.ExportRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

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
            standardDocx.Object,
            consultingDocx.Object,
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

        CareerArtifactExportBlockedException exception =
            (await act.Should().ThrowAsync<CareerArtifactExportBlockedException>()).Which;

        exception.BlockReasonCode.Should().Be(CareerArtifactCompletenessValidator.SampleWorkspaceExportCode);
        analysis.Verify(
            a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
