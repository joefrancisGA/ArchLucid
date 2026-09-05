using ArchLucid.Application.Analysis;
using ArchLucid.Application.Analysis.ReplayComparison;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.ArchitectureIntelligence;
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

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
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
  public async Task BuildAsync_pairs_export_records_by_compare_run_id_not_creation_order()
  {
    RunExportRecord leftPeerA = new()
    {
      ExportRecordId = "left-peer-a",
      RunId = "left-run",
      ExportType = "analysis-report-markdown",
      TemplateProfile = "internal",
      Format = "markdown",
      CompareRunId = "peer-run-a",
      CreatedUtc = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord leftPeerB = new()
    {
      ExportRecordId = "left-peer-b",
      RunId = "left-run",
      ExportType = "analysis-report-markdown",
      TemplateProfile = "internal",
      Format = "markdown",
      CompareRunId = "peer-run-b",
      CreatedUtc = new DateTime(2026, 1, 1, 9, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord rightPeerB = new()
    {
      ExportRecordId = "right-peer-b",
      RunId = "right-run",
      ExportType = "analysis-report-markdown",
      TemplateProfile = "internal",
      Format = "markdown",
      CompareRunId = "peer-run-b",
      CreatedUtc = new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc),
    };
    RunExportRecord rightPeerA = new()
    {
      ExportRecordId = "right-peer-a",
      RunId = "right-run",
      ExportType = "analysis-report-markdown",
      TemplateProfile = "internal",
      Format = "markdown",
      CompareRunId = "peer-run-a",
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
      .ReturnsAsync([leftPeerA, leftPeerB]);
    exportRecords
      .Setup(r => r.GetByRunIdAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync([rightPeerB, rightPeerA]);

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
        It.Is<RunExportRecord>(record => record.ExportRecordId == "left-peer-a"),
        It.Is<RunExportRecord>(record => record.ExportRecordId == "right-peer-a"),
        It.IsAny<CancellationToken>()),
      Times.Once);
    exportDiff.Verify(
      s => s.CompareAsync(
        It.Is<RunExportRecord>(record => record.ExportRecordId == "left-peer-b"),
        It.Is<RunExportRecord>(record => record.ExportRecordId == "right-peer-b"),
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

  [Fact]
  public async Task BuildAsync_when_manifest_warnings_only_adds_material_manifest_interpretation_note()
  {
    GoldenManifest leftManifest = new() { RunId = "left-run", SystemName = "Sys" };
    GoldenManifest rightManifest = new() { RunId = "right-run", SystemName = "Sys" };
    ManifestDiffResult manifestDiff = new()
    {
      Warnings = ["SystemName differs between compared manifests."],
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "left-run",
        DateTime.UtcNow,
        leftManifest,
        [new AgentResult { RunId = "left-run", TaskId = "t1", AgentType = AgentType.Topology }]));
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "right-run",
        DateTime.UtcNow,
        rightManifest,
        [new AgentResult { RunId = "right-run", TaskId = "t1", AgentType = AgentType.Topology }]));

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IAgentResultDiffService> agentDiffService = new();
    agentDiffService
      .Setup(s => s.Compare("left-run", It.IsAny<IReadOnlyList<AgentResult>>(), "right-run", It.IsAny<IReadOnlyList<AgentResult>>()))
      .Returns(new AgentResultDiffResult());

    Mock<IManifestDiffService> manifestDiffService = new();
    manifestDiffService
      .Setup(s => s.Compare(leftManifest, rightManifest))
      .Returns(manifestDiff);

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
      exportRecords,
      manifestDiffService,
      null,
      agentDiffService);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.InterpretationNotes.Should().Contain(note =>
      note.Contains("manifest changed without meaningful agent drift", StringComparison.OrdinalIgnoreCase));
  }

  [Fact]
  public async Task BuildAsync_when_only_agent_confidence_changed_adds_material_agent_interpretation_note()
  {
    GoldenManifest leftManifest = new() { RunId = "left-run", SystemName = "Sys" };
    GoldenManifest rightManifest = new() { RunId = "right-run", SystemName = "Sys" };
    AgentResultDiffResult agentDiff = new()
    {
      AgentDeltas =
      [
        new AgentResultDelta
        {
          AgentType = AgentType.Topology,
          LeftExists = true,
          RightExists = true,
          LeftConfidence = 0.42,
          RightConfidence = 0.88,
        }
      ]
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "left-run",
        DateTime.UtcNow,
        leftManifest,
        [new AgentResult { RunId = "left-run", TaskId = "t1", AgentType = AgentType.Topology }]));
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "right-run",
        DateTime.UtcNow,
        rightManifest,
        [new AgentResult { RunId = "right-run", TaskId = "t1", AgentType = AgentType.Topology }]));

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IAgentResultDiffService> agentDiffService = new();
    agentDiffService
      .Setup(s => s.Compare("left-run", It.IsAny<IReadOnlyList<AgentResult>>(), "right-run", It.IsAny<IReadOnlyList<AgentResult>>()))
      .Returns(agentDiff);

    Mock<IManifestDiffService> manifestDiffService = new();
    manifestDiffService
      .Setup(s => s.Compare(leftManifest, rightManifest))
      .Returns(new ManifestDiffResult());

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
      exportRecords,
      manifestDiffService,
      null,
      agentDiffService);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.InterpretationNotes.Should().Contain(note =>
      note.Contains("Agent outputs changed", StringComparison.OrdinalIgnoreCase)
      && note.Contains("manifest remained stable", StringComparison.OrdinalIgnoreCase));
    report.InterpretationNotes.Should().NotContain(note =>
      note.Contains("Neither agent outputs nor manifest changed materially", StringComparison.OrdinalIgnoreCase));
  }

  [Fact]
  public async Task BuildAsync_when_only_evidence_refs_changed_adds_material_agent_interpretation_note()
  {
    GoldenManifest leftManifest = new() { RunId = "left-run", SystemName = "Sys" };
    GoldenManifest rightManifest = new() { RunId = "right-run", SystemName = "Sys" };
    AgentResultDiffResult agentDiff = new()
    {
      AgentDeltas =
      [
        new AgentResultDelta
        {
          AgentType = AgentType.Compliance,
          LeftExists = true,
          RightExists = true,
          AddedEvidenceRefs = ["policy-pack:encrypt-at-rest"],
        }
      ]
    };

    Mock<IRunDetailQueryService> runDetailQuery = new();
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("left-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "left-run",
        DateTime.UtcNow,
        leftManifest,
        [new AgentResult { RunId = "left-run", TaskId = "t1", AgentType = AgentType.Compliance }]));
    runDetailQuery
      .Setup(s => s.GetRunDetailForRollupAsync("right-run", It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateDetail(
        "right-run",
        DateTime.UtcNow,
        rightManifest,
        [new AgentResult { RunId = "right-run", TaskId = "t1", AgentType = AgentType.Compliance }]));

    Mock<IRunExportRecordRepository> exportRecords = new();
    exportRecords
      .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync(Array.Empty<RunExportRecord>());

    Mock<IAgentResultDiffService> agentDiffService = new();
    agentDiffService
      .Setup(s => s.Compare("left-run", It.IsAny<IReadOnlyList<AgentResult>>(), "right-run", It.IsAny<IReadOnlyList<AgentResult>>()))
      .Returns(agentDiff);

    Mock<IManifestDiffService> manifestDiffService = new();
    manifestDiffService
      .Setup(s => s.Compare(leftManifest, rightManifest))
      .Returns(new ManifestDiffResult());

    EndToEndReplayComparisonService sut = CreateSut(
      runDetailQuery,
      exportRecords,
      manifestDiffService,
      null,
      agentDiffService);

    EndToEndReplayComparisonReport report = await sut.BuildAsync("left-run", "right-run");

    report.InterpretationNotes.Should().Contain(note =>
      note.Contains("Agent outputs changed", StringComparison.OrdinalIgnoreCase)
      && note.Contains("manifest remained stable", StringComparison.OrdinalIgnoreCase));
  }

  private static EndToEndReplayComparisonService CreateSut(
    Mock<IRunDetailQueryService> runDetailQuery,
    Mock<IRunExportRecordRepository> exportRecords,
    Mock<IManifestDiffService> manifestDiff,
    Mock<IExportRecordDiffService>? exportDiff = null,
    Mock<IAgentResultDiffService>? agentDiff = null)
  {
    return CreateSut(
      runDetailQuery,
      exportRecords.Object,
      agentDiff?.Object ?? Mock.Of<IAgentResultDiffService>(),
      manifestDiff.Object,
      exportDiff?.Object ?? Mock.Of<IExportRecordDiffService>(),
      new CrossReviewFindingCorrelationService(),
      CreateLifecycleService(),
      Mock.Of<IArchitectureKnowledgeModelAccess>(),
      CreateScopeProvider());
  }

  private static EndToEndReplayComparisonService CreateSut(
    Mock<IRunDetailQueryService> runDetailQuery,
    IRunExportRecordRepository exportRecords,
    IAgentResultDiffService agentDiff,
    IManifestDiffService manifestDiff,
    IExportRecordDiffService exportDiff,
    ICrossReviewFindingCorrelationService correlationService,
    ICrossReviewFindingLifecycleService lifecycleService,
    IArchitectureKnowledgeModelAccess intelligence,
    IScopeContextProvider scopeProvider)
  {
    EndToEndReplayComparisonReportComposer composer = new([
      new ReplayComparisonAgentResultsDiffSlice(agentDiff),
      new ReplayComparisonManifestsDiffSlice(manifestDiff),
      new ReplayComparisonExportsDiffSlice(exportDiff),
      new ReplayComparisonFindingLifecycleDiffSlice(
        correlationService,
        lifecycleService,
        intelligence,
        scopeProvider),
      new ReplayComparisonInterpretationDiffSlice(),
    ]);

        return new EndToEndReplayComparisonService(
      CreateCompareRunsFacade(runDetailQuery).Object,
      Mock.Of<IRunRepository>(),
      exportRecords,
      scopeProvider,
      composer);
  }

  private static Mock<ICompareRunsApplicationFacade> CreateCompareRunsFacade(Mock<IRunDetailQueryService> runDetailQuery)
  {
    Mock<ICompareRunsApplicationFacade> compareRunsFacade = new();
    compareRunsFacade
      .Setup(f => f.LoadScopedRunPairAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
      .ReturnsAsync((string leftRunId, string rightRunId, CancellationToken ct) =>
      {
        ArchitectureRunDetail? left = runDetailQuery.Object
          .GetRunDetailForRollupAsync(leftRunId, ct)
          .GetAwaiter()
          .GetResult();
        ArchitectureRunDetail? right = runDetailQuery.Object
          .GetRunDetailForRollupAsync(rightRunId, ct)
          .GetAwaiter()
          .GetResult();

        if (left is null)
        {
          return new ScopedRunPairLoadResult
          {
            Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
            MissingRunId = leftRunId,
          };
        }

        if (right is null)
        {
          return new ScopedRunPairLoadResult
          {
            Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
            MissingRunId = rightRunId,
          };
        }

        return new ScopedRunPairLoadResult
        {
          Outcome = ScopedRunPairLoadOutcome.Success,
          Left = left,
          Right = right,
        };
      });

    return compareRunsFacade;
  }

  private static ICrossReviewFindingLifecycleService CreateLifecycleService()
  {
    Mock<IFindingReviewTrailRepository> reviewTrailRepository = new();
    reviewTrailRepository
      .Setup(r => r.ListForFindingIdsSinceUtcAsync(
        It.IsAny<Guid>(),
        It.IsAny<IReadOnlyCollection<string>>(),
        It.IsAny<DateTimeOffset>(),
        It.IsAny<CancellationToken>()))
      .ReturnsAsync([]);

    return new CrossReviewFindingLifecycleService(reviewTrailRepository.Object);
  }

  private static IScopeContextProvider CreateScopeProvider()
  {
    Mock<IScopeContextProvider> scopeProvider = new();
    scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

    return scopeProvider.Object;
  }

  private static ArchitectureRunDetail CreateDetail(
    string runId,
    DateTime? completedUtc,
    GoldenManifest? manifest = null,
    IReadOnlyList<AgentResult>? results = null)
  {
    return new ArchitectureRunDetail
    {
      Run = new ArchitectureRun
      {
        RunId = runId,
        RequestId = "req-" + runId,
        CompletedUtc = completedUtc,
      },
      Manifest = manifest,
      Results = results is null ? [] : [.. results],
    };
  }
}
