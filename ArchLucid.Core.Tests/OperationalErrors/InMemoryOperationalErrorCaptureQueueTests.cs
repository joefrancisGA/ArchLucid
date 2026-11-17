using ArchLucid.Core.OperationalErrors;

namespace ArchLucid.Core.Tests.OperationalErrors;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryOperationalErrorCaptureQueueTests
{
    [Fact]
    public async Task Full_queue_rejects_new_capture()
    {
        InMemoryOperationalErrorCaptureQueue queue = new(1);
        OperationalErrorRecord first = new();

        Assert.True(queue.TryEnqueue(first));
        Assert.False(queue.TryEnqueue(new OperationalErrorRecord()));
        Assert.Equal(1, queue.ApproximatePendingCount);
        Assert.Equal(first.Id, (await queue.DequeueAsync(CancellationToken.None)).Id);
        queue.NotifyPersistedSuccess();
        Assert.Equal(0, queue.ApproximatePendingCount);
    }

    [Fact]
    public async Task Full_queue_rejects_retry_and_removes_failed_record_from_pending_count()
    {
        InMemoryOperationalErrorCaptureQueue queue = new(1);
        OperationalErrorRecord next = new();
        Assert.True(queue.TryEnqueue(new OperationalErrorRecord()));
        OperationalErrorRecord failed = await queue.DequeueAsync(CancellationToken.None);
        Assert.True(queue.TryEnqueue(next));

        Assert.False(queue.TryReturnToQueueAfterFailedDrain(failed));
        Assert.Equal(1, queue.ApproximatePendingCount);
        Assert.Equal(next.Id, (await queue.DequeueAsync(CancellationToken.None)).Id);
        queue.NotifyPersistedSuccess();
        Assert.Equal(0, queue.ApproximatePendingCount);
    }
}
