using ArchLucid.Persistence.Coordination.Retrieval;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination;

/// <summary>Deterministic dequeue / lease / dead-letter parity for retrieval indexing SQL outbox behavior.</summary>
[Trait("Suite", "Core")]
public sealed class InMemoryRetrievalIndexingOutboxRepositoryRecoverabilityTests
{
    [Fact]
    public async Task DequeuePendingAsync_sets_exclusive_lease_blocking_second_worker_scan()
    {
        DateTime utc = new DateTime(2026, 5, 24, 12, 0, 0, DateTimeKind.Utc);
        InMemoryRetrievalIndexingOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(runId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        IReadOnlyList<RetrievalIndexingOutboxEntry> first =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        first.Should().ContainSingle(e => e.RunId == runId);
        first[0].LockedUntilUtc.Should().Be(utc.AddSeconds(300));

        IReadOnlyList<RetrievalIndexingOutboxEntry> second =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        second.Should().BeEmpty();

        utc = utc.AddSeconds(301);

        IReadOnlyList<RetrievalIndexingOutboxEntry> third =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        third.Should().ContainSingle(e => e.RunId == runId);
        third[0].AttemptCount.Should().Be(0);
    }

    [Fact]
    public async Task RecordDeadLetter_increments_dead_counters_and_blocks_dequeue()
    {
        DateTime utc = new DateTime(2026, 5, 24, 13, 0, 0, DateTimeKind.Utc);
        InMemoryRetrievalIndexingOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(runId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);
        RetrievalIndexingOutboxEntry claimed =
            (await sut.DequeuePendingAsync(5, 300, CancellationToken.None)).Should().ContainSingle().Subject;

        await sut.RecordDeadLetterAsync(claimed.OutboxId, "poison", CancellationToken.None);

        (await sut.CountDeadLetteredAsync(CancellationToken.None)).Should().Be(1);
        (await sut.CountPendingAsync(CancellationToken.None)).Should().Be(0);
        (await sut.DequeuePendingAsync(5, 300, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task RecordBackoffAfterProcessingFailure_respects_next_attempt_and_releases_claim()
    {
        DateTime utc = new DateTime(2026, 5, 24, 14, 0, 0, DateTimeKind.Utc);
        InMemoryRetrievalIndexingOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(runId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        RetrievalIndexingOutboxEntry claimed =
            (await sut.DequeuePendingAsync(3, 300, CancellationToken.None)).Should().ContainSingle().Subject;

        DateTime resumeAt = utc.AddMinutes(30);
        await sut.RecordBackoffAfterProcessingFailureAsync(
            claimed.OutboxId,
            resumeAt,
            "transient",
            CancellationToken.None);

        (await sut.DequeuePendingAsync(3, 300, CancellationToken.None)).Should().BeEmpty();

        utc = resumeAt.AddSeconds(1);

        (await sut.DequeuePendingAsync(3, 300, CancellationToken.None)).Should().ContainSingle();
    }
}
