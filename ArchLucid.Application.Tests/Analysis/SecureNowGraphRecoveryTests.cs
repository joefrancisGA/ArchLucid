using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowGraphRecoveryTests
{
    [Fact]
    public async Task Graph_reuses_only_checkpointed_outputs_whose_durable_witness_still_matches()
    {
        SecureNowAnalysisRecoveryJob job = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(), InputVersion = new string('A', 64),
        };
        Mock<IAnalysisRecoveryRepository> store = new(MockBehavior.Strict);
        var session = new SecureNowRecoverySession(store.Object, job, 3, new FakeTimeProvider(),
            NullLogger.Instance, CancellationToken.None, versioned: true, useGraph: true);
        var scope = SecureNowRecoverySession.Scope(job);
        var plan = new AnalysisRecoveryStageKey(scope, "securenow", job.SnapshotId, AnalysisDependencyGraphs.Plan);
        var carry = new AnalysisRecoveryStageKey(scope, "securenow", job.SnapshotId, AnalysisDependencyGraphs.Carry);
        MockReadAndClaim(plan, "carry_forward", AnalysisDependencyFingerprint.Digest(AnalysisDependencyGraphs.Plan));
        MockReadAndClaim(carry, 1, "original-path-witness");

        Assert.Equal("carry_forward", await session.PinPlanAsync("pinned-diff", "carry_forward", CancellationToken.None));
        session.BindOutputWitness((_, _) => Task.FromResult<string?>("changed-path-witness"));

        var failure = await Assert.ThrowsAsync<AnalysisDependencyRejectionException>(() =>
            session.ExecuteAsync(AnalysisDependencyGraphs.Carry, _ => Task.FromResult(2), null, CancellationToken.None));
        Assert.Equal("output_missing", failure.Reason);
        store.VerifyAll();

        void MockReadAndClaim<T>(AnalysisRecoveryStageKey key, T result, string witness)
        {
            store.Setup(repository => repository.ReadAsync(key, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AnalysisRecoveryClaim?)null);
            store.Setup(repository => repository.ClaimAsync(key, It.IsAny<string>(), It.IsAny<Guid>(), 30, 3,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync((AnalysisRecoveryStageKey _, string version, Guid _, int _, int _, CancellationToken _) =>
                    new AnalysisRecoveryClaim
                    {
                        State = "succeeded", InputVersion = version, Fence = 1, Attempts = 1,
                        ResultReference = JsonSerializer.Serialize(new AnalysisDependencyOutput<T>(result, witness),
                            AuditJsonSerializationOptions.Instance),
                    });
        }
    }
}
