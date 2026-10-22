using ArchLucid.Persistence.Coordination.Projection;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination;

/// <summary>Deterministic dequeue / lease / dead-letter parity for post-commit projection SQL outbox behavior.</summary>
[Trait("Suite", "Core")]
public sealed class InMemoryPostCommitProjectionOutboxRepositoryRecoverabilityTests
{
    [Fact]
    public async Task DequeuePendingAsync_sets_exclusive_lease_blocking_second_worker_scan()
    {
        DateTime utc = new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc);
        InMemoryPostCommitProjectionOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            runId,
            null,
            CancellationToken.None);

        IReadOnlyList<PostCommitProjectionOutboxEntry> first =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        first.Should().ContainSingle(e => e.RunId == runId);
        first[0].LockedUntilUtc.Should().Be(utc.AddSeconds(300));

        IReadOnlyList<PostCommitProjectionOutboxEntry> second =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        second.Should().BeEmpty();

        utc = utc.AddSeconds(301);

        IReadOnlyList<PostCommitProjectionOutboxEntry> third =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        third.Should().ContainSingle(e => e.RunId == runId);
        third[0].AttemptCount.Should().Be(0);
    }

    [Fact]
    public async Task RecordDeadLetter_increments_dead_counters_and_blocks_dequeue()
    {
        DateTime utc = new DateTime(2026, 6, 6, 13, 0, 0, DateTimeKind.Utc);
        InMemoryPostCommitProjectionOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            PostCommitProjectionWorkTypes.ReviewCompletedEvent,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            runId,
            null,
            CancellationToken.None);
        PostCommitProjectionOutboxEntry claimed =
            (await sut.DequeuePendingAsync(5, 300, CancellationToken.None)).Should().ContainSingle().Subject;

        await sut.RecordDeadLetterAsync(claimed.OutboxId, "poison", CancellationToken.None);

        (await sut.CountDeadLetteredAsync(CancellationToken.None)).Should().Be(1);
        (await sut.CountPendingAsync(CancellationToken.None)).Should().Be(0);
        (await sut.DequeuePendingAsync(5, 300, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task RecordBackoffAfterProcessingFailure_respects_next_attempt_and_releases_claim()
    {
        DateTime utc = new DateTime(2026, 6, 6, 14, 0, 0, DateTimeKind.Utc);
        InMemoryPostCommitProjectionOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            PostCommitProjectionWorkTypes.FindingPriorityRerank,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            runId,
            null,
            CancellationToken.None);

        PostCommitProjectionOutboxEntry claimed =
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
