using ArchLucid.Persistence.Coordination.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination.Diagnostics;

public sealed class InMemoryOutboxOperationalMetricsReaderTests
{
    [Fact]
    public async Task ReadSnapshotAsync_returns_zeroed_snapshot()
    {
        InMemoryOutboxOperationalMetricsReader reader = new();

        OutboxOperationalMetricsSnapshot snapshot = await reader.ReadSnapshotAsync(CancellationToken.None);

        snapshot.AuthorityPipelineWorkPending.Should().Be(0);
        snapshot.RetrievalIndexingOutboxPending.Should().Be(0);
        snapshot.IntegrationEventOutboxPublishPending.Should().Be(0);
        snapshot.IntegrationEventOutboxDeadLetter.Should().Be(0);
    }
}
