namespace ArchLucid.Persistence.Tests.Coordination.Diagnostics;
[Trait("Category", "Unit")]

public sealed class InMemoryOutboxOperationalMetricsReaderTests
{
    [SkippableFact]
    public async Task ReadSnapshotAsync_returns_zeroed_snapshot()
    {
        InMemoryOutboxOperationalMetricsReader reader = new();

        OutboxOperationalMetricsSnapshot snapshot = await reader.ReadSnapshotAsync(CancellationToken.None);

        snapshot.AuthorityPipelineWorkPending.Should().Be(0);
        snapshot.AuthorityPipelineWorkDeadLetter.Should().Be(0);
        snapshot.RetrievalIndexingOutboxPending.Should().Be(0);
        snapshot.IntegrationEventOutboxPublishPending.Should().Be(0);
        snapshot.IntegrationEventOutboxDeadLetter.Should().Be(0);
        snapshot.RunExportBlobPushOutboxPending.Should().Be(0);
        snapshot.RunExportBlobPushOutboxDeadLetter.Should().Be(0);
        snapshot.RunExportBlobPushOutboxOldestPendingAgeSeconds.Should().Be(0);
        snapshot.PostCommitProjectionOutboxPending.Should().Be(0);
        snapshot.PostCommitProjectionOutboxDeadLetter.Should().Be(0);
        snapshot.PostCommitProjectionOutboxOldestPendingAgeSeconds.Should().Be(0);
    }
}
