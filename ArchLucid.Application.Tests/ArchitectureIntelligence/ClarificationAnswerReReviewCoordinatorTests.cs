using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;

using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClarificationAnswerReReviewCoordinatorTests
{
  [Fact]
  public async Task TryRunAfterApplyAsync_returns_null_when_no_answers_applied()
  {
    ClarificationAnswerReReviewCoordinator sut = CreateSut(
        knowledgeModelAccess: null,
        incrementalReReview: null,
        specialistReview: null,
        findingsUpdater: null,
        stageOutcomes: null,
        audit: null);

    IncrementalReReviewResult? result = await sut.TryRunAfterApplyAsync(
        new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
        Guid.NewGuid(),
        0,
        new Dictionary<string, string>(),
        CancellationToken.None);

    result.Should().BeNull();
  }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TryRunAfterApplyAsync_records_terminal_error_when_re_review_fails(bool completionWriteFails)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid runId = Guid.NewGuid();
        ArchitectureKnowledgeModel model = new();
        Mock<IArchitectureKnowledgeModelAccess> modelAccess = new();
        modelAccess.Setup(access => access.GetForRunAsync(scope, runId, CancellationToken.None)).ReturnsAsync(model);
        InvalidOperationException failure = new("Review failed.");
        Mock<IIncrementalReReviewService> reReview = new();
        reReview.Setup(service => service.ReReviewAsync(
            model, It.IsAny<ReReviewScope>(), It.IsAny<IAsyncSpecialistReviewService>(), CancellationToken.None))
            .ThrowsAsync(failure);
        Mock<IRunStageOutcomesRepository> stages = new();
        if (completionWriteFails)
        {
            stages.Setup(repo => repo.RecordStageCompletedAsync(
                runId, "clarification-re-review", "error", It.IsAny<DateTime>(), CancellationToken.None))
                .ThrowsAsync(new InvalidOperationException("Stage write failed."));
        }

        ClarificationAnswerReReviewCoordinator sut = CreateSut(
            modelAccess.Object, reReview.Object, null, null, stages.Object, null);

        Func<Task> run = () => sut.TryRunAfterApplyAsync(
            scope, runId, 1, new Dictionary<string, string>(), CancellationToken.None);

        (await run.Should().ThrowAsync<InvalidOperationException>()).Which.Should().BeSameAs(failure);
        stages.Verify(repo => repo.RecordStageCompletedAsync(
            runId, "clarification-re-review", "error", It.IsAny<DateTime>(), CancellationToken.None), Times.Once);
    }

    private static ClarificationAnswerReReviewCoordinator CreateSut(
      IArchitectureKnowledgeModelAccess? knowledgeModelAccess,
      IIncrementalReReviewService? incrementalReReview,
      IAsyncSpecialistReviewService? specialistReview,
      IAuthorityFindingsSnapshotUpdater? findingsUpdater,
      IRunStageOutcomesRepository? stageOutcomes,
      IAuditService? audit)
  {
    return new ClarificationAnswerReReviewCoordinator(
        knowledgeModelAccess,
        incrementalReReview ?? new IncrementalReReviewService(),
        specialistReview ?? Mock.Of<IAsyncSpecialistReviewService>(),
        findingsUpdater,
        stageOutcomes ?? Mock.Of<IRunStageOutcomesRepository>(),
        audit ?? Mock.Of<IAuditService>(),
        Mock.Of<IReRunExecuteSealedManifestPinGate>());
  }
}
