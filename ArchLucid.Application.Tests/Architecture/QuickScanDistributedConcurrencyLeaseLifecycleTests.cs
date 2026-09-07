using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "QuickScanDistributedConcurrency")]
public sealed class QuickScanDistributedConcurrencyLeaseLifecycleTests
{
    [Fact]
    public async Task WaitForAdmissionAsync_abandons_queue_entry_when_promote_is_cancelled()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        CancellationTokenPromoteStore store = new(inner, queueEntryId);
        using CancellationTokenSource cancellation = new();
        QuickScanDistributedConcurrencyService service = CreateService(store);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-request", cancellation.Token);

        await Task.Delay(50);
        await cancellation.CancelAsync();

        Func<Task> act = () => waitTask;

        await act.Should().ThrowAsync<OperationCanceledException>();

        QuickScanConcurrencyAdmitResult followUpQueue = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "after-promote-cancel", maxConcurrent: 1, maxQueued: 1));

        followUpQueue.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Queued,
            "cancelled promote must abandon its queue row so capacity is not pinned until QueueExpiresUtc");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_abandons_queue_entry_when_caller_cancels_while_waiting()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        Guid activeLeaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        using CancellationTokenSource cancellation = new();
        QuickScanDistributedConcurrencyService service = CreateService(store);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-request", cancellation.Token);

        await Task.Delay(50);
        await cancellation.CancelAsync();

        Func<Task> act = () => waitTask;

        await act.Should().ThrowAsync<OperationCanceledException>();

        QuickScanConcurrencyAdmitResult followUpQueue = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "after-cancel", maxConcurrent: 1, maxQueued: 1));

        followUpQueue.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Queued,
            "cancelled waiter must abandon its queue row so capacity is not pinned until QueueExpiresUtc");
    }

    [Fact]
    public async Task ExecuteAsync_releases_concurrency_lease_when_global_budget_rejects_after_admission()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        QuickScanGuardContext guardContext = new()
        {
            ClientIp = "203.0.113.10",
            SessionId = "session",
            PayloadFingerprint = "trace",
            UseDistributedConcurrencyLimit = true,
        };

        QuickScanDistributedConcurrencyAdmissionResult admission = QuickScanDistributedConcurrencyAdmissionResult.Permit(
            leaseId,
            store,
            fixture.Telemetry.Object,
            guardContext,
            safetyOptions.Object,
            TimeProvider.System,
            CancellationToken.None);

        fixture.Concurrency
            .Setup(c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(admission);

        fixture.GlobalBudget
            .Setup(g => g.TryReserveAsync(
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanGlobalBudgetReservationAttemptResult.Reject(
                QuickScanGlobalBudgetReservationRejectionReason.HourlyCeilingExceeded));

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.CapacityReached);

        QuickScanConcurrencyAdmitResult followUp = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0));

        followUp.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "orchestrator must dispose the admitted lease when budget reservation fails after concurrency admission");
    }

    private static QuickScanDistributedConcurrencyService CreateService(
        IQuickScanDistributedConcurrencyStore store)
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 30,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.Normal,
                AnonymousExecutionAllowed = true,
                SampleResultAvailable = true,
                PublicMessage = string.Empty,
                StoreHealthy = true,
            });

        return new QuickScanDistributedConcurrencyService(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);
    }

    private static QuickScanConcurrencyAdmitRequest BuildAdmitRequest(
        Guid leaseId,
        Guid queueEntryId,
        string requestKey,
        int maxConcurrent,
        int maxQueued)
    {
        DateTimeOffset utcNow = TimeProvider.System.GetUtcNow();

        return new QuickScanConcurrencyAdmitRequest
        {
            LeaseId = leaseId,
            QueueEntryId = queueEntryId,
            RequestKey = requestKey,
            HolderInstanceId = "test-instance",
            UtcNow = utcNow,
            MaxConcurrentScans = maxConcurrent,
            MaxQueuedScans = maxQueued,
            QueueWaitTimeout = TimeSpan.FromSeconds(30),
            LeaseDuration = TimeSpan.FromSeconds(60),
        };
    }

    private sealed class CancellationTokenPromoteStore(InMemoryQuickScanDistributedConcurrencyStore inner, Guid queuedEntryId)
        : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default)
        {
            QuickScanConcurrencyAdmitRequest rewritten = new()
            {
                LeaseId = request.LeaseId,
                QueueEntryId = queuedEntryId,
                RequestKey = request.RequestKey,
                HolderInstanceId = request.HolderInstanceId,
                UtcNow = request.UtcNow,
                MaxConcurrentScans = request.MaxConcurrentScans,
                MaxQueuedScans = request.MaxQueuedScans,
                QueueWaitTimeout = request.QueueWaitTimeout,
                LeaseDuration = request.LeaseDuration,
            };

            return inner.TryAdmitAsync(rewritten, cancellationToken);
        }

        public async Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken).ConfigureAwait(false);

            return QuickScanConcurrencyPromoteResult.NotYet();
        }

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            inner.ReleaseLeaseAsync(leaseId, cancellationToken);

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            inner.AbandonQueueEntryAsync(queueEntryId, cancellationToken);

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
    }
}
