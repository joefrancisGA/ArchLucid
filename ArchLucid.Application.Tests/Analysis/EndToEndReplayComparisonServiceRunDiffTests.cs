using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
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

    Mock<IArchitectureIntelligencePersistence> intelligence = new();
    intelligence
      .Setup(p => p.GetModelByRunIdAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
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
