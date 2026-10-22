using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OutboxDepthGaugeValuesTests
{
    [Fact]
    public void OutboxDepthGaugeValues_record_stores_queue_depths()
    {
        OutboxDepthGaugeValues values = new(
            AuthorityPipelineWorkPending: 4,
            AuthorityPipelineWorkOldestPendingAgeSeconds: 12.5,
            RetrievalIndexingOutboxPending: 2,
            RetrievalIndexingOutboxOldestPendingAgeSeconds: 3.1,
            RetrievalIndexingOutboxDeadLetter: 1,
            IntegrationEventOutboxPublishPending: 6,
            IntegrationEventOutboxDeadLetter: 0,
            IntegrationEventOutboxOldestActionablePendingAgeSeconds: 8.2,
            AuthorityPipelineWorkDeadLetter: 1,
            RunExportBlobPushOutboxPending: 5,
            RunExportBlobPushOutboxOldestPendingAgeSeconds: 1.4,
            RunExportBlobPushOutboxDeadLetter: 0,
            PostCommitProjectionOutboxPending: 7,
            PostCommitProjectionOutboxOldestPendingAgeSeconds: 9.9,
            PostCommitProjectionOutboxDeadLetter: 2);

        values.AuthorityPipelineWorkPending.Should().Be(4);
        values.RetrievalIndexingOutboxDeadLetter.Should().Be(1);
        values.PostCommitProjectionOutboxDeadLetter.Should().Be(2);
        values.IntegrationEventOutboxOldestActionablePendingAgeSeconds.Should().Be(8.2);
    }
}
