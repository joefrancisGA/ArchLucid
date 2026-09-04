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
