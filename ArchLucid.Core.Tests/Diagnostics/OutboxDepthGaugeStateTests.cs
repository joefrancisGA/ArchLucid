using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;
[Trait("Category", "Unit")]

public sealed class OutboxDepthGaugeStateTests
{
    [Fact]
    public void Publish_updates_Current_atomically_visible()
    {
        OutboxDepthGaugeState state = new();
        OutboxDepthGaugeValues first = new(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
        OutboxDepthGaugeValues second = new(10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150);

        state.Publish(in first);
        state.Current.Should().Be(first);

        state.Publish(in second);
        state.Current.Should().Be(second);
    }

    [Fact]
    public void Publish_exposes_run_export_blob_push_outbox_depth_fields()
    {
        OutboxDepthGaugeState state = new();
        OutboxDepthGaugeValues values = new(0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 42.5, 1, 0, 0, 0);

        state.Publish(in values);

        state.Current.RunExportBlobPushOutboxPending.Should().Be(3);
        state.Current.RunExportBlobPushOutboxOldestPendingAgeSeconds.Should().Be(42.5);
        state.Current.RunExportBlobPushOutboxDeadLetter.Should().Be(1);
    }

    [Fact]
    public void Publish_exposes_post_commit_projection_outbox_depth_fields()
    {
        OutboxDepthGaugeState state = new();
        OutboxDepthGaugeValues values = new(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 99.0, 2);

        state.Publish(in values);

        state.Current.PostCommitProjectionOutboxPending.Should().Be(5);
        state.Current.PostCommitProjectionOutboxOldestPendingAgeSeconds.Should().Be(99.0);
        state.Current.PostCommitProjectionOutboxDeadLetter.Should().Be(2);
    }
}
