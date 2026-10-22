using ArchLucid.Persistence.Coordination.Export;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination;

/// <summary>Deterministic dequeue / lease / dead-letter parity for run-export blob push SQL outbox behavior.</summary>
[Trait("Suite", "Core")]
public sealed class InMemoryRunExportBlobPushOutboxRepositoryRecoverabilityTests
{
    [Fact]
    public async Task DequeuePendingAsync_sets_exclusive_lease_blocking_second_worker_scan()
    {
        DateTime utc = new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc);
        InMemoryRunExportBlobPushOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            runId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "https://example.blob.core.windows.net/container/blob?sas=token",
            CancellationToken.None);

        IReadOnlyList<RunExportBlobPushOutboxEntry> first =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        first.Should().ContainSingle(e => e.RunId == runId);
        first[0].LockedUntilUtc.Should().Be(utc.AddSeconds(300));

        IReadOnlyList<RunExportBlobPushOutboxEntry> second =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        second.Should().BeEmpty();

        utc = utc.AddSeconds(301);

        IReadOnlyList<RunExportBlobPushOutboxEntry> third =
            await sut.DequeuePendingAsync(1, 300, CancellationToken.None);

        third.Should().ContainSingle(e => e.RunId == runId);
        third[0].AttemptCount.Should().Be(0);
    }

    [Fact]
    public async Task RecordDeadLetter_increments_dead_counters_and_blocks_dequeue()
    {
        DateTime utc = new DateTime(2026, 6, 6, 13, 0, 0, DateTimeKind.Utc);
        InMemoryRunExportBlobPushOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            runId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "https://example.blob.core.windows.net/container/blob?sas=token",
            CancellationToken.None);
        RunExportBlobPushOutboxEntry claimed =
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
        InMemoryRunExportBlobPushOutboxRepository sut = new(() => utc);
        Guid runId = Guid.NewGuid();
        await sut.EnqueueAsync(
            runId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "https://example.blob.core.windows.net/container/blob?sas=token",
            CancellationToken.None);

        RunExportBlobPushOutboxEntry claimed =
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
