using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class InMemoryAuditRetryQueueTests
{
    [Fact]
    public async Task Rejected_enqueue_does_not_change_pending_count()
    {
        InMemoryAuditRetryQueue queue = new(1);
        queue.TryEnqueue(NewEvent()).Should().BeTrue();
        queue.TryEnqueue(NewEvent()).Should().BeFalse();
        queue.ApproximatePendingCount.Should().Be(1);

        await queue.DequeueAsync(CancellationToken.None);
        queue.NotifyPersistedSuccess();
        queue.ApproximatePendingCount.Should().Be(0);
    }

    [Fact]
    public async Task Concurrent_consumer_does_not_observe_negative_pending_count()
    {
        InMemoryAuditRetryQueue queue = new(1);
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(10));
        const int count = 500;

        Task consumer = Task.Run(async () =>
        {
            for (int i = 0; i < count; i++)
            {
                await queue.DequeueAsync(timeout.Token);
                queue.NotifyPersistedSuccess();
                queue.ApproximatePendingCount.Should().BeGreaterThanOrEqualTo(0);
            }
        });

        for (int i = 0; i < count; i++)
        {
            AuditEvent next = NewEvent();
            while (!queue.TryEnqueue(next))
            {
                timeout.Token.ThrowIfCancellationRequested();
                await Task.Yield();
            }
        }

        await consumer;
        queue.ApproximatePendingCount.Should().Be(0);
    }

    [Fact]
    public void Constructor_rejects_non_positive_capacity()
    {
        Action act = () => _ = new InMemoryAuditRetryQueue(0);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task TryEnqueue_and_dequeue_round_trip_updates_pending_count()
    {
        InMemoryAuditRetryQueue queue = new(2);
        AuditEvent first = NewEvent();
        AuditEvent second = NewEvent();

        queue.TryEnqueue(first).Should().BeTrue();
        queue.TryEnqueue(second).Should().BeTrue();
        queue.ApproximatePendingCount.Should().Be(2);

        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);
        dequeued.EventType.Should().Be(first.EventType);
        queue.NotifyPersistedSuccess();
        queue.ApproximatePendingCount.Should().Be(1);
    }

    [Fact]
    public async Task TryReturnToQueueAfterFailedDrain_requeues_when_space_available()
    {
        InMemoryAuditRetryQueue queue = new(2);
        AuditEvent auditEvent = NewEvent();

        queue.TryEnqueue(auditEvent).Should().BeTrue();
        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);
        dequeued.EventId.Should().Be(auditEvent.EventId);

        queue.TryReturnToQueueAfterFailedDrain(dequeued).Should().BeTrue();
        queue.ApproximatePendingCount.Should().Be(1);
    }

    [Fact]
    public void TryEnqueue_throws_when_event_is_null()
    {
        InMemoryAuditRetryQueue queue = new();

        Action act = () => queue.TryEnqueue(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void TryReturnToQueueAfterFailedDrain_throws_when_event_is_null()
    {
        InMemoryAuditRetryQueue queue = new();

        Action act = () => queue.TryReturnToQueueAfterFailedDrain(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static AuditEvent NewEvent()
    {
        return new AuditEvent
        {
            EventType = "TestEvent",
            ActorUserId = "actor",
            ActorUserName = "Actor",
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
    }
}
