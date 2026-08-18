using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures end-to-end run comparison loads both runs through <see cref="IRunDetailQueryService" />
///     (49R canonical path) rather than ad hoc repository assembly.
/// </summary>
[Trait("Category", "Unit")]
public sealed class EndToEndReplayComparisonServiceTests
{
    private readonly Mock<IAgentResultDiffService> _agentDiff = new();
    private readonly Mock<IExportRecordDiffService> _exportDiff = new();
    private readonly Mock<IRunExportRecordRepository> _exportRepo = new();
    private readonly Mock<IManifestDiffService> _manifestDiff = new();
    private readonly Mock<IRunDetailQueryService> _runDetailQueryService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IFindingReviewTrailRepository> _reviewTrailRepository = new();
    private readonly Mock<IScopeContextProvider> _scopeContextProvider = new();
    private readonly Mock<IArchitectureIntelligencePersistence> _architectureIntelligencePersistence = new();
    private readonly EndToEndReplayComparisonService _sut;

    public EndToEndReplayComparisonServiceTests()
    {
        _reviewTrailRepository
            .Setup(repository => repository.ListForFindingIdsSinceUtcAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _scopeContextProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext());
        _architectureIntelligencePersistence
            .Setup(persistence => persistence.GetModelByRunIdAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureKnowledgeModel?)null);
        _sut = new EndToEndReplayComparisonService(
            _runDetailQueryService.Object,
            _runRepository.Object,
            _exportRepo.Object,
            _agentDiff.Object,
            _manifestDiff.Object,
            _exportDiff.Object,
            new ArchLucid.Application.Findings.CrossReviewFindingCorrelationService(),
            new ArchLucid.Application.Findings.CrossReviewFindingLifecycleService(_reviewTrailRepository.Object),
            _architectureIntelligencePersistence.Object,
            _scopeContextProvider.Object);
    }

    private static ArchitectureRun Run(string id, string? manifestVersion = null, StructuralExecutionMode mode = StructuralExecutionMode.Simulator)
    {
        return new ArchitectureRun
        {
            RunId = id,
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentManifestVersion = manifestVersion,
            StructuralExecutionMode = mode,
        };
    }

    private static GoldenManifest Manifest(string runId, string version)
    {
        return new GoldenManifest
        {
            RunId = runId, SystemName = "Sys", Metadata = new ManifestMetadata { ManifestVersion = version }
        };
    }

    [SkippableFact]
    public async Task BuildAsync_LoadsBothRunsViaRunDetailQueryService_AndComparesManifestsFromDetail()
    {
        ArchitectureRunDetail left = new()
        {
            Run = Run("left", "vL"),
            Results = [new AgentResult { RunId = "left", TaskId = "t1", AgentType = AgentType.Topology }],
            Manifest = Manifest("left", "vL")
        };
        ArchitectureRunDetail right = new()
        {
            Run = Run("right", "vR"), Results = [], Manifest = Manifest("right", "vR")
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("left", It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("right", It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        _exportRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunExportRecord>());
        _manifestDiff.Setup(m => m.Compare(left.Manifest, right.Manifest)).Returns(new ManifestDiffResult());
        _agentDiff.Setup(a => a.Compare("left", left.Results, "right", right.Results))
            .Returns(new AgentResultDiffResult());

        EndToEndReplayComparisonReport report = await _sut.BuildAsync("left", "right");

        report.LeftRunId.Should().Be("left");
        report.RightRunId.Should().Be("right");
        _runDetailQueryService.Verify(s => s.GetRunDetailForRollupAsync("left", It.IsAny<CancellationToken>()), Times.Once);
        _runDetailQueryService.Verify(s => s.GetRunDetailForRollupAsync("right", It.IsAny<CancellationToken>()), Times.Once);
        _manifestDiff.Verify(m => m.Compare(left.Manifest, right.Manifest), Times.Once);
    }

    [SkippableFact]
    public async Task BuildAsync_WhenExecutionModesDiffer_AddsInterpretationNote()
    {
        ArchitectureRunDetail left = new()
        {
            Run = Run("left", "v1", StructuralExecutionMode.Real),
            Results = [],
            Manifest = Manifest("left", "v1"),
        };
        ArchitectureRunDetail right = new()
        {
            Run = Run("right", "v1", StructuralExecutionMode.Simulator),
            Results = [],
            Manifest = Manifest("right", "v1"),
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("left", It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("right", It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        _exportRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunExportRecord>());
        _manifestDiff.Setup(m => m.Compare(left.Manifest, right.Manifest)).Returns(new ManifestDiffResult());

        EndToEndReplayComparisonReport report = await _sut.BuildAsync("left", "right");

        report.RunDiff.ExecutionModesDiffer.Should().BeTrue();
        report.InterpretationNotes.Should().Contain(note =>
            note.Contains("Structural execution mode differs", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task BuildAsync_WhenExecutionModesMatchNonReal_AddsDirectionalInterpretationNote()
    {
        ArchitectureRunDetail left = new()
        {
            Run = Run("left", "v1", StructuralExecutionMode.Simulator),
            Results = [],
            Manifest = Manifest("left", "v1"),
        };
        ArchitectureRunDetail right = new()
        {
            Run = Run("right", "v1", StructuralExecutionMode.Simulator),
            Results = [],
            Manifest = Manifest("right", "v1"),
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("left", It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("right", It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        _exportRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunExportRecord>());
        _manifestDiff.Setup(m => m.Compare(left.Manifest, right.Manifest)).Returns(new ManifestDiffResult());

        EndToEndReplayComparisonReport report = await _sut.BuildAsync("left", "right");

        report.RunDiff.SharedNonRealExecutionMode.Should().BeTrue();
        report.InterpretationNotes.Should().Contain(note =>
            note.Contains("directional only", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task BuildAsync_WhenLeftRunMissing_ThrowsRunNotFoundException()
    {
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        Func<Task<EndToEndReplayComparisonReport>> act = () => _sut.BuildAsync("missing", "right");

        await act.Should().ThrowAsync<RunNotFoundException>().WithMessage("*missing*");
    }

    [SkippableFact]
    public async Task BuildAsync_WhenModelAliasIdsDiffer_FlagsRunDiffAndAddsInterpretationNote()
    {
        ArchitectureRunDetail left = new()
        {
            Run = Run("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "v1"),
            Results = [],
            Manifest = Manifest("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "v1"),
        };
        ArchitectureRunDetail right = new()
        {
            Run = Run("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "v1"),
            Results = [],
            Manifest = Manifest("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "v1"),
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync(left.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync(right.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        _exportRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunExportRecord>());
        _manifestDiff.Setup(m => m.Compare(left.Manifest, right.Manifest)).Returns(new ManifestDiffResult());

        Guid leftGuid = Guid.ParseExact(left.Run.RunId, "N");
        Guid rightGuid = Guid.ParseExact(right.Run.RunId, "N");

        _runRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), leftGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = leftGuid,
                    EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(
                        new ReviewRunEngineProvenance { ModelAliasId = "economy-general" })
                });
        _runRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), rightGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = rightGuid,
                    EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(
                        new ReviewRunEngineProvenance { ModelAliasId = "premium-assurance" })
                });

        EndToEndReplayComparisonReport report = await _sut.BuildAsync(left.Run.RunId, right.Run.RunId);

        report.RunDiff.ModelAliasIdsDiffer.Should().BeTrue();
        report.RunDiff.ChangedFields.Should().Contain("ModelAliasId");
        report.InterpretationNotes.Should().Contain(note =>
            note.Contains("Catalog model alias differs", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public async Task BuildAsync_WhenEnginesDiffer_AndManifestsMatch_EngineChangeIsLeadingInterpretationNote()
    {
        ArchitectureRunDetail left = new()
        {
            Run = Run("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "v1"),
            Results = [],
            Manifest = Manifest("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "v1"),
        };
        ArchitectureRunDetail right = new()
        {
            Run = Run("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "v1"),
            Results = [],
            Manifest = Manifest("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "v1"),
        };

        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync(left.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        _runDetailQueryService.Setup(s => s.GetRunDetailForRollupAsync(right.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        _exportRepo.Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RunExportRecord>());
        _manifestDiff.Setup(m => m.Compare(left.Manifest, right.Manifest)).Returns(new ManifestDiffResult());

        Guid leftGuid = Guid.ParseExact(left.Run.RunId, "N");
        Guid rightGuid = Guid.ParseExact(right.Run.RunId, "N");

        _runRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), leftGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = leftGuid,
                    EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(
                        new ReviewRunEngineProvenance
                        {
                            ModelAliasId = "economy-general",
                            TaskEvaluationSnapshotsAtSelection =
                            [
                                new ReviewRunEngineTaskEvaluationSnapshot
                                {
                                    TaskType = "Topology",
                                    EvaluationState = "NotEvaluated",
                                }
                            ]
                        })
                });
        _runRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), rightGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = rightGuid,
                    EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(
                        new ReviewRunEngineProvenance { ModelAliasId = "premium-assurance" })
                });

        EndToEndReplayComparisonReport report = await _sut.BuildAsync(left.Run.RunId, right.Run.RunId);

        report.RunDiff.ModelAliasIdsDiffer.Should().BeTrue();
        report.InterpretationNotes.Should().NotBeEmpty();
        report.InterpretationNotes[0].Should().Contain("Catalog model alias differs");
        report.InterpretationNotes[0].Should().Contain("NotEvaluated");
        report.InterpretationNotes[0].Should().NotContain("directional only");
    }
}
