using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class InMemoryAuditRetryQueueTests
{
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
