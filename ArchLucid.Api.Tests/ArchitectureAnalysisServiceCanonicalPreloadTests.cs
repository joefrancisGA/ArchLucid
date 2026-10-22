using ArchLucid.Application.Analysis;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures analysis export uses the canonical <see cref="ArchitectureRunDetail" /> when the API
///     preloads it, avoiding redundant <see cref="IRunDetailQueryService" /> and manifest repository calls.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArchitectureAnalysisServiceCanonicalPreloadTests
{
    private const string VerifiedManifestHash =
        "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789";

    private readonly Mock<IAgentResultDiffService> _agentResultDiffService = new();
    private readonly Mock<IDeterminismCheckService> _determinismCheckService = new();
    private readonly Mock<IDiagramGenerator> _diagramGenerator = new();
    private readonly Mock<IAgentEvidencePackageRepository> _evidenceRepository = new();
    private readonly Mock<IManifestDiffService> _manifestDiffService = new();
    private readonly Mock<IAgentResultRepository> _resultRepository = new();
    private readonly Mock<IRunDetailQueryService> _runDetailQueryService = new();
    private readonly Mock<IManifestSummaryGenerator> _summaryGenerator = new();
    private readonly Mock<IScopeContextProvider> _scopeContextProvider = new();
    private readonly ArchitectureAnalysisService _sut;
    private readonly Mock<IAgentExecutionTraceRepository> _traceRepository = new();
    private readonly Mock<IUnifiedGoldenManifestReader> _unifiedGoldenManifestReader = new();
    private readonly Mock<IAuthorityQueryService> _authorityQueryService = new();
    private readonly Mock<IManifestHashService> _manifestHashService = new();

    public ArchitectureAnalysisServiceCanonicalPreloadTests()
    {
        _evidenceRepository.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);
        _traceRepository.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());
        _manifestHashService
            .Setup(h => h.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(VerifiedManifestHash);
        _authorityQueryService
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken __) => new RunDetailDto
            {
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = VerifiedManifestHash,
                },
            });
        _sut = new ArchitectureAnalysisService(
            _runDetailQueryService.Object,
            _scopeContextProvider.Object,
            _unifiedGoldenManifestReader.Object,
            _evidenceRepository.Object,
            _traceRepository.Object,
            _resultRepository.Object,
            _diagramGenerator.Object,
            _summaryGenerator.Object,
            _determinismCheckService.Object,
            _manifestDiffService.Object,
            _agentResultDiffService.Object,
            _authorityQueryService.Object,
            _manifestHashService.Object);
    }

    [SkippableFact]
    public async Task BuildAsync_WithPreloadedRunDetail_DoesNotRecallRunDetailOrPrimaryManifestFromRepository()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("D");
        GoldenManifest manifest = new()
        {
            RunId = runId, SystemName = "Sys", Metadata = new ManifestMetadata { ManifestVersion = "v1" }
        };
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1",
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            Manifest = manifest,
            Tasks = [],
            Results = []
        };

        ArchitectureAnalysisRequest request = new()
        {
            RunId = runId,
            PreloadedRunDetail = detail,
            IncludeEvidence = false,
            IncludeExecutionTraces = false,
            IncludeManifest = true,
            IncludeDiagram = false,
            IncludeSummary = false
        };

        ArchitectureAnalysisReport report = await _sut.BuildAsync(request);

        report.Manifest.Should().BeSameAs(manifest);
        _runDetailQueryService.Verify(
            s => s.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()),
            Times.Never);
        _unifiedGoldenManifestReader.Verify(
            m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_WithPreloadedRunDetail_UsesManifestWhenCurrentManifestVersionEmpty()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("D");
        GoldenManifest manifest = new()
        {
            RunId = runId, SystemName = "Sys", Metadata = new ManifestMetadata { ManifestVersion = "v1-run-1" }
        };
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = "req-1",
                Status = ArchitectureRunStatus.TasksGenerated,
                CurrentManifestVersion = null,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            Manifest = manifest,
            Tasks = [],
            Results = []
        };

        ArchitectureAnalysisRequest request = new()
        {
            RunId = runId,
            PreloadedRunDetail = detail,
            IncludeEvidence = false,
            IncludeExecutionTraces = false,
            IncludeManifest = true,
            IncludeDiagram = false,
            IncludeSummary = false
        };

        ArchitectureAnalysisReport report = await _sut.BuildAsync(request);

        report.Manifest.Should().BeSameAs(manifest);
        _unifiedGoldenManifestReader.Verify(
            m => m.GetByVersionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
