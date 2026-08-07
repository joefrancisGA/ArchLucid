using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Projection;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class PostCommitProjectionEnqueuerTests
{
    [Fact]
    public async Task EnqueueAfterCommitAsync_enqueues_core_rows_and_optional_gated_rows()
    {
        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        List<string> workTypes = [];
        outbox
            .Setup(o => o.EnqueueAsync(
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, Guid, Guid, Guid, Guid?, string?, CancellationToken>(
                (workType, _, _, _, _, _, _) => workTypes.Add(workType))
            .Returns(Task.CompletedTask);

        PostCommitProjectionEnqueuer sut = new(outbox.Object);
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        await sut.EnqueueAfterCommitAsync(
            runId,
            scope,
            enqueueSampleRunPurge: true,
            enqueueFindingPriorityRerank: true,
            enqueueIacStubGeneration: false,
            CancellationToken.None);

        workTypes.Should().BeEquivalentTo(
        [
            PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
            PostCommitProjectionWorkTypes.ReviewCompletedEvent,
            PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization,
            PostCommitProjectionWorkTypes.FindingPriorityRerank,
            PostCommitProjectionWorkTypes.SampleRunPurgeForTenant
        ]);
    }
}
