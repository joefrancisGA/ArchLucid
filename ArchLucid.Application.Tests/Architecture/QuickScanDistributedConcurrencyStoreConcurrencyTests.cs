using ArchLucid.Application.Architecture;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanDistributedConcurrencyStoreConcurrencyTests
{
    private static readonly DateTimeOffset BaseUtc = new(2026, 7, 20, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task TryAdmitAsync_concurrent_workers_never_exceed_max_concurrent_scans()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        const int workerCount = 20;
        const int maxConcurrent = 3;
        int admittedCount = 0;

        await Parallel.ForAsync(
            0,
            workerCount,
            new ParallelOptions { MaxDegreeOfParallelism = 12 },
            async (index, _) =>
            {
                QuickScanConcurrencyAdmitRequest request = BuildAdmitRequest(
                    leaseId: Guid.NewGuid(),
                    queueEntryId: Guid.NewGuid(),
                    requestKey: $"worker-{index}",
                    maxConcurrent: maxConcurrent,
                    maxQueued: 0);

                QuickScanConcurrencyAdmitResult result = await store.TryAdmitAsync(request);

                if (result.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease)
                {
                    Interlocked.Increment(ref admittedCount);
                }
            });

        admittedCount.Should().Be(maxConcurrent);
    }

    [Fact]
    public async Task TryAdmitAsync_queues_when_at_capacity_and_rejects_when_queue_full()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        const int maxConcurrent = 2;
        const int maxQueued = 2;
        List<Guid> activeLeases = new();

        for (int index = 0; index < maxConcurrent; index++)
        {
            QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
                BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), $"direct-{index}", maxConcurrent, maxQueued));

            direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);
            activeLeases.Add(direct.LeaseId!.Value);
        }

        QuickScanConcurrencyAdmitResult queuedOne = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "queued-1", maxConcurrent, maxQueued));
        QuickScanConcurrencyAdmitResult queuedTwo = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "queued-2", maxConcurrent, maxQueued));
        QuickScanConcurrencyAdmitResult queueFull = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "queue-full", maxConcurrent, maxQueued));

        queuedOne.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.Queued);
        queuedTwo.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.Queued);
        queueFull.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.QueueFull);

        await store.ReleaseLeaseAsync(activeLeases[0]);

        QuickScanConcurrencyPromoteResult promoted = await store.TryPromoteAsync(
            new QuickScanConcurrencyPromoteRequest
            {
                QueueEntryId = queuedOne.QueueEntryId!.Value,
                LeaseId = Guid.NewGuid(),
                HolderInstanceId = "test",
                UtcNow = BaseUtc,
                MaxConcurrentScans = maxConcurrent,
                LeaseDuration = TimeSpan.FromSeconds(60),
            });

        promoted.Promoted.Should().BeTrue();
    }

    [Fact]
    public async Task AbandonQueueEntry_does_not_hold_lease_for_cancelled_waiter()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 4));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        QuickScanConcurrencyAdmitResult queued = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), queueEntryId, "canceled", maxConcurrent: 1, maxQueued: 4));

        queued.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.Queued);

        await store.AbandonQueueEntryAsync(queueEntryId);

        QuickScanConcurrencyPromoteResult promote = await store.TryPromoteAsync(
            new QuickScanConcurrencyPromoteRequest
            {
                QueueEntryId = queueEntryId,
                LeaseId = Guid.NewGuid(),
                HolderInstanceId = "test",
                UtcNow = BaseUtc,
                MaxConcurrentScans = 1,
                LeaseDuration = TimeSpan.FromSeconds(60),
            });

        promote.Promoted.Should().BeFalse();
    }

    private static QuickScanConcurrencyAdmitRequest BuildAdmitRequest(
        Guid leaseId,
        Guid queueEntryId,
        string requestKey,
        int maxConcurrent,
        int maxQueued) =>
        new()
        {
            LeaseId = leaseId,
            QueueEntryId = queueEntryId,
            RequestKey = requestKey,
            HolderInstanceId = "test-instance",
            UtcNow = BaseUtc,
            MaxConcurrentScans = maxConcurrent,
            MaxQueuedScans = maxQueued,
            QueueWaitTimeout = TimeSpan.FromSeconds(30),
            LeaseDuration = TimeSpan.FromSeconds(60),
        };
}
