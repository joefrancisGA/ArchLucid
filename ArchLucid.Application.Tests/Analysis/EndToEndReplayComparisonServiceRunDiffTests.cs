using ArchLucid.Application.Analysis;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EndToEndReplayComparisonServiceRunDiffTests
{
  [Fact]
  public async Task BuildAsync_marks_completion_state_differs_when_completed_utc_values_differ()
  {
    DateTime leftCompleted = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
    DateTime rightCompleted = new(2026, 1, 2, 12, 0, 0, DateTimeKind.Utc);

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail("left-run", leftCompleted));
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail("right-run", rightCompleted));

    Mock<IRunRepository> runRepository = new();
    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IFindingReviewTrailRepository> reviewTrailRepository = new();
    reviewTrailRepository
      .Setup(r => r.ListForFindingIdsSinceUtcAsync(
        It.IsAny<Guid>(),
        It.IsAny<IReadOnlyCollection<string>>(),
        It.IsAny<DateTimeOffset>(),
        It.IsAny<CancellationToken>()))
      .ReturnsAsync([]);

    Mock<IArchitectureKnowledgeModelAccess> intelligence = new();
    intelligence
      .Setup(k => k.GetForRunAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);

    Mock<IScopeContextProvider> scopeProvider = new();
    scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

    EndToEndReplayComparisonService sut = new(
      runDetailQuery.Object,
      runRepository.Object,
      exportRecords.Object,
      Mock.Of<IAgentResultDiffService>(),
      Mock.Of<IManifestDiffService>(),
      Mock.Of<IExportRecordDiffService>(),
      new CrossReviewFindingCorrelationService(),
      new CrossReviewFindingLifecycleService(reviewTrailRepository.Object),
      intelligence.Object,
      scopeProvider.Object);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.RunDiff.ChangedFields.Should().Contain("CompletedUtc");
    report.RunDiff.CompletionStateDiffers.Should().BeTrue();
  }

  [Fact]
  public async Task BuildAsync_compares_manifests_when_both_bodies_exist_despite_asymmetric_version_metadata()
  {
    GoldenManifest leftManifest = new()
    {
      RunId = "left-run",
      SystemName = "Sys",
      Metadata = new ManifestMetadata { ManifestVersion = "v1" },
    };
    GoldenManifest rightManifest = new()
    {
      RunId = "right-run",
      SystemName = "Sys",
      Metadata = new ManifestMetadata { ManifestVersion = "v2" },
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun
        {
          RunId = "left-run",
          RequestId = "req-left",
          CurrentManifestVersion = "v1",
        },
        Manifest = leftManifest,
      });
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun
        {
          RunId = "right-run",
          RequestId = "req-right",
          CurrentManifestVersion = null,
        },
        Manifest = rightManifest,
      });

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    ManifestDiffResult manifestDiffResult = new() { AddedServices = ["orders-api"] };
    Mock<IManifestDiffService> manifestDiff = new();
    manifestDiff
      .Setup(m => m.Compare(leftManifest, rightManifest))
      .Returns(manifestDiffResult);

    EndToEndReplayComparisonService sut = CreateSut(runDetailQuery, exportRecords, manifestDiff);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    manifestDiff.Verify(m => m.Compare(leftManifest, rightManifest), Times.Once);
    report.ManifestDiff.Should().BeSameAs(manifestDiffResult);
    report.Warnings.Should().NotContain("One or both manifests were unavailable for manifest comparison.");
  }

  [Fact]
  public async Task BuildAsync_when_version_metadata_exists_but_manifest_body_missing_adds_warning()
  {
    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun
        {
          RunId = "left-run",
          RequestId = "req-left",
          CurrentManifestVersion = "v1",
        },
        Manifest = null,
      });
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun
        {
          RunId = "right-run",
          RequestId = "req-right",
          CurrentManifestVersion = null,
        },
        Manifest = null,
      });

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IManifestDiffService> manifestDiff = new();

    EndToEndReplayComparisonService sut = CreateSut(runDetailQuery, exportRecords, manifestDiff);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.ManifestDiff.Should().BeNull();
    report.Warnings.Should().Contain("One or both manifests were unavailable for manifest comparison.");
    manifestDiff.Verify(
      m => m.Compare(It.IsAny<GoldenManifest>(), It.IsAny<GoldenManifest>()),
      Times.Never);
  }

  [Fact]
  public async Task BuildAsync_pairs_export_records_by_template_profile_not_creation_order()
  {
    RunExportRecord leftSponsor = new()
    {
      ExportRecordId = "left-sponsor",
      RunId = "left-run",
      ExportType = "analysis-report-consulting-docx",
      TemplateProfile = "sponsor",
      Format = "docx",
      CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord leftInternal = new()
    {
      ExportRecordId = "left-internal",
      RunId = "left-run",
      ExportType = "analysis-report-consulting-docx",
      TemplateProfile = "internal",
      Format = "docx",
      CreatedUtc = new DateTime(2026, 1, 1, 9, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord rightInternal = new()
    {
      ExportRecordId = "right-internal",
      RunId = "right-run",
      ExportType = "analysis-report-consulting-docx",
      TemplateProfile = "internal",
      Format = "docx",
      CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord rightSponsor = new()
    {
      ExportRecordId = "right-sponsor",
      RunId = "right-run",
      ExportType = "analysis-report-consulting-docx",
      TemplateProfile = "sponsor",
      Format = "docx",
      CreatedUtc = new DateTime(2026, 1, 2, 9, 0, 0, DateTimeKind.Utc),
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail("left-run", null));
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail("right-run", null));

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync([leftSponsor, leftInternal]);
    exportRecords
      .Setup(r => r.GetByRunIdAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync([rightInternal, rightSponsor]);

    Mock<IExportRecordDiffService> exportDiff = new();
    exportDiff
      .Setup(s => s.CompareAsync(It.IsAny<RunExportRecord>(), It.IsAny<RunExportRecord>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ExportRecordDiffResult());

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
      exportRecords,
      new Mock<IManifestDiffService>(),
      exportDiff);

    await sut.BuildAsync("left-run", "right-run");

    exportDiff.Verify(
      s => s.CompareAsync(
        It.Is<RunExportRecord>(record => record.ExportRecordId == "left-sponsor"),
        It.Is<RunExportRecord>(record => record.ExportRecordId == "right-sponsor"),
        It.IsAny<CancellationToken>()),
      Times.Once);
    exportDiff.Verify(
      s => s.CompareAsync(
        It.Is<RunExportRecord>(record => record.ExportRecordId == "left-internal"),
        It.Is<RunExportRecord>(record => record.ExportRecordId == "right-internal"),
        It.IsAny<CancellationToken>()),
      Times.Once);
  }

  [Fact]
  public async Task BuildAsync_when_manifest_missing_but_agent_changed_adds_interpretation_note()
  {
    AgentResultDiffResult agentDiff = new()
    {
      AgentDeltas =
      [
        new AgentResultDelta { AddedClaims = ["claim-a"] },
      ],
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun { RunId = "left-run", RequestId = "req-left" },
        Results = [new AgentResult { RunId = "left-run", TaskId = "t1", AgentType = AgentType.Topology }],
      });
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureRunDetail
      {
        Run = new ArchitectureRun { RunId = "right-run", RequestId = "req-right" },
        Results = [new AgentResult { RunId = "right-run", TaskId = "t1", AgentType = AgentType.Topology }],
      });

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IAgentResultDiffService> agentDiffService = new();
    agentDiffService
      .Setup(s => s.Compare("left-run", It.IsAny<IReadOnlyList<AgentResult>>(), "right-run", It.IsAny<IReadOnlyList<AgentResult>>()))
      .Returns(agentDiff);

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
      exportRecords,
      new Mock<IManifestDiffService>(),
      null,
      agentDiffService);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.ManifestDiff.Should().BeNull();
    report.InterpretationNotes.Should().Contain(note =>
      note.Contains("Agent outputs changed", StringComparison.OrdinalIgnoreCase)
      && note.Contains("manifest was not compared", StringComparison.OrdinalIgnoreCase));
  }

  private static EndToEndReplayComparisonService CreateSut(
    Mock<IRunDetailQueryService> runDetailQuery,
    Mock<IRunExportRecordRepository> exportRecords,
    Mock<IManifestDiffService> manifestDiff,
    Mock<IExportRecordDiffService>? exportDiff = null,
    Mock<IAgentResultDiffService>? agentDiff = null)
  {
    Mock<IFindingReviewTrailRepository> reviewTrailRepository = new();
    reviewTrailRepository
      .Setup(r => r.ListForFindingIdsSinceUtcAsync(
        It.IsAny<Guid>(),
        It.IsAny<IReadOnlyCollection<string>>(),
        It.IsAny<DateTimeOffset>(),
        It.IsAny<CancellationToken>()))
      .ReturnsAsync([]);

    Mock<IArchitectureKnowledgeModelAccess> intelligence = new();
    intelligence
      .Setup(k => k.GetForRunAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);

    Mock<IScopeContextProvider> scopeProvider = new();
    scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

    return new EndToEndReplayComparisonService(
      runDetailQuery.Object,
      Mock.Of<IRunRepository>(),
      exportRecords.Object,
      agentDiff?.Object ?? Mock.Of<IAgentResultDiffService>(),
      manifestDiff.Object,
      exportDiff?.Object ?? Mock.Of<IExportRecordDiffService>(),
      new CrossReviewFindingCorrelationService(),
      new CrossReviewFindingLifecycleService(reviewTrailRepository.Object),
      intelligence.Object,
      scopeProvider.Object);
  }

  private static ArchitectureRunDetail CreateDetail(string runId, DateTime? completedUtc)
  {
    return new ArchitectureRunDetail
    {
      Run = new ArchitectureRun
      {
        RunId = runId,
        RequestId = "req-" + runId,
        CompletedUtc = completedUtc,
      },
    };
  }
}
