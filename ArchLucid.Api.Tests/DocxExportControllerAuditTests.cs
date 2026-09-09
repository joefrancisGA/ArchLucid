using System.Text.Json;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class DocxExportControllerAuditTests
{
    [SkippableFact]
    public async Task ExportRunDocx_AfterSuccessfulExport_LogsArchitectureDocxExportGeneratedWithDataJson()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid? compareWith = Guid.NewGuid();

        ManifestHashService manifestHashService = new();
        FeasibilityVerdict verdict = DocxExportControllerTestSupport.CreateFeasibilityVerdictWithTrail();
        ManifestDocument sealedManifest = DocxExportControllerTestSupport.CreateSealedExportManifest(
            runId,
            manifestId,
            verdict,
            manifestHashService);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        Mock<IAuthorityQueryService> authority = new();
        DocxExportControllerTestSupport.SetupAuthorityForDocxExport(
            authority,
            runId,
            sealedManifest,
            GoldenCorpusHarnessEngineRegistration.RegisteredEngineCount);
        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), compareWith.Value, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = new RunRecord { RunId = compareWith.Value }, GoldenManifest = sealedManifest });
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                compareWith.Value,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = new RunRecord { RunId = compareWith.Value }, GoldenManifest = sealedManifest });
        authority
            .Setup(a => a.GetRunDetailForExportAsync(
                It.IsAny<ScopeContext>(),
                compareWith.Value,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = compareWith.Value },
                GoldenManifest = sealedManifest,
                FindingCoverageSummary = new RunFindingCoverageSummary
                {
                    EnginesSucceeded = GoldenCorpusHarnessEngineRegistration.RegisteredEngineCount,
                },
            });

        Mock<IArtifactQueryService> artifacts = new();
        artifacts
            .Setup(a => a.GetArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), manifestId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SynthesizedArtifact>());

        Mock<IComparisonService> comparison = new();
        comparison.Setup(c => c.Compare(
                It.IsAny<ArchLucid.Core.Manifest.ManifestDocument>(),
                It.IsAny<ArchLucid.Core.Manifest.ManifestDocument>()))
            .Returns(new ComparisonResult());

        byte[] payload = [1, 2, 3, 4];
        Mock<IDocxExportService> docx = new();
        docx
            .Setup(d => d.ExportAsync(It.IsAny<DocxExportRequest>(), sealedManifest,
                It.IsAny<IReadOnlyList<SynthesizedArtifact>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new DocxExportResult
                {
                    Content = payload,
                    ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    FileName = "x.docx"
                });

        Mock<IAuditService> audit = new();

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = runId.ToString("N"),
                    ContextSnapshotId = "ctx",
                    GraphSnapshotId = Guid.NewGuid(),
                    FindingsSnapshotId = Guid.NewGuid(),
                },
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PreCommitGovernance:PreCommitGateEnabled"] = "true",
            })
            .Build();

        DocxExportController sut = new(
            authority.Object,
            runDetailQuery.Object,
            artifacts.Object,
            docx.Object,
            comparison.Object,
            Mock.Of<IExplanationService>(),
            Mock.Of<IProvenanceSnapshotRepository>(),
            scope.Object,
            manifestHashService,
            Mock.Of<IGraphSnapshotRepository>(),
            DocxExportControllerTestSupport.CreateAgentExecutionTraceRepository(),
            configuration,
            audit.Object,
            NullLogger<DocxExportController>.Instance) { ControllerContext = AnalysisReportsControllerAuditTests.CreateControllerContext() };

        IActionResult result = await sut.ExportRunDocx(runId, compareWith, false, false, CancellationToken.None);

        result.Should().BeOfType<FileContentResult>();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureDocxExportGenerated
                    && e.RunId == runId
                    && e.ManifestId == manifestId
                    && !string.IsNullOrWhiteSpace(e.DataJson)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        JsonDocument doc = JsonDocument.Parse(
            audit.Invocations[0].Arguments[0] is AuditEvent ev ? ev.DataJson : "{}");
        doc.RootElement.GetProperty("byteCount").GetInt32().Should().Be(payload.Length);
        doc.RootElement.GetProperty("compareWithRunId").GetGuid().Should().Be(compareWith.Value);
    }
}
