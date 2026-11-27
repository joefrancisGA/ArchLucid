using ArchLucid.Application.Analysis;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowRecoverySessionTests
{
    [Fact]
    public async Task Reclaim_uses_completed_stage_without_reinvoking_work()
    {
        Guid target = Guid.NewGuid();
        Guid prior = Guid.NewGuid();
        SecureNowAnalysisRecoveryJob job = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            SnapshotId = target, InputVersion = new string('A', 64)
        };
        Mock<IAnalysisRecoveryRepository> store = new(MockBehavior.Strict);
        const string stage = "securenow.prior_snapshot";
        AnalysisRecoveryStageKey key = new(SecureNowRecoverySession.Scope(job), "securenow", target, stage);
        store.Setup(repo => repo.ClaimAsync(key, job.InputVersion, It.IsAny<Guid>(), 30, 3, CancellationToken.None))
            .ReturnsAsync(new AnalysisRecoveryClaim
            {
                State = "succeeded", InputVersion = job.InputVersion, ResultReference = $"\"{prior:D}\"",
                Fence = 1, Attempts = 1
            });
        SecureNowRecoverySession session = new(store.Object, job, 3, new FakeTimeProvider(),
            NullLogger.Instance, CancellationToken.None);

        Guid? result = await session.ExecuteAsync<Guid?>(stage,
            _ => throw new InvalidOperationException("Completed work must not be invoked."), null, CancellationToken.None);

        Assert.Equal(prior, result);
        store.VerifyAll();
    }

    [Fact]
    public async Task Ambiguous_audit_side_effect_is_never_replayed()
    {
        SecureNowAnalysisRecoveryJob job = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(), InputVersion = new string('A', 64)
        };
        Mock<IAnalysisRecoveryRepository> store = new(MockBehavior.Strict);
        const string stage = "securenow.audit_readiness";
        AnalysisRecoveryStageKey key = new(SecureNowRecoverySession.Scope(job), "securenow", job.SnapshotId, stage);
        store.Setup(repo => repo.ClaimAsync(key, job.InputVersion, It.IsAny<Guid>(), 30, 1, CancellationToken.None))
            .ReturnsAsync(new AnalysisRecoveryClaim
            {
                State = "failed", InputVersion = job.InputVersion, Fence = 2, Attempts = 1
            });
        SecureNowRecoverySession session = new(store.Object, job, 3, new FakeTimeProvider(),
            NullLogger.Instance, CancellationToken.None);

        AnalysisStageExecutionException failure = await Assert.ThrowsAsync<AnalysisStageExecutionException>(() =>
            session.ExecuteAsync<bool>(stage, _ => throw new InvalidOperationException("Audit cannot replay."),
                null, CancellationToken.None));

        Assert.Equal(AnalysisStageOutcome.RetryExhausted, failure.Outcome);
        store.VerifyAll();
    }
}
