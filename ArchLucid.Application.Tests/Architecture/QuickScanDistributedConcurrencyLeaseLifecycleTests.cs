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

    [Fact]
    public async Task ExecuteAsync_releases_concurrency_lease_when_operational_emergency_flips_after_admission()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        bool firstSnapshot = true;

        fixture.Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                if (firstSnapshot)
                {
                    firstSnapshot = false;

                    return new QuickScanSafetyOperationalSnapshot
                    {
                        Mode = QuickScanSafetyOperationalMode.Normal,
                        AnonymousExecutionAllowed = true,
                        SampleResultAvailable = true,
                        PublicMessage = string.Empty,
                        StoreHealthy = true,
                    };
                }

                return new QuickScanSafetyOperationalSnapshot
                {
                    Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                    AnonymousExecutionAllowed = false,
                    SampleResultAvailable = true,
                    PublicMessage = "Kill switch flipped.",
                    StoreHealthy = true,
                };
            });

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

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.EmergencyDisabled);

        QuickScanConcurrencyAdmitResult followUp = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0));

        followUp.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "orchestrator must dispose the admitted lease when operational emergency flips after concurrency admission");
    }

    [Fact]
    public async Task DisposeAsync_releases_lease_when_renewal_loop_faults()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        ThrowingRenewLeaseStore store = new(inner);
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 1,
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
            Mock.Of<IQuickScanTelemetry>(),
            guardContext,
            safetyOptions.Object,
            TimeProvider.System,
            CancellationToken.None);

        await Task.Delay(TimeSpan.FromSeconds(1.5));

        Func<Task> dispose = async () => await admission.DisposeAsync();

        await dispose.Should().NotThrowAsync("renewal store failures must not skip lease release on dispose");

        QuickScanConcurrencyAdmitResult followUp = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0));

        followUp.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "dispose must release the slot when renewal fails instead of pinning until lease TTL expiry");
    }

    [Fact]
    public async Task ExecutionCancellationToken_is_cancelled_when_renewal_store_fails()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        ThrowingRenewLeaseStore store = new(inner);
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 1,
            },
        });

        QuickScanGuardContext guardContext = new()
        {
            ClientIp = "203.0.113.10",
            SessionId = "session",
            PayloadFingerprint = "trace",
            UseDistributedConcurrencyLimit = true,
        };

        using CancellationTokenSource executionCancellation = new();
        QuickScanDistributedConcurrencyAdmissionResult admission = QuickScanDistributedConcurrencyAdmissionResult.Permit(
            leaseId,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            guardContext,
            safetyOptions.Object,
            TimeProvider.System,
            executionCancellation.Token);

        await Task.Delay(TimeSpan.FromSeconds(1.5));

        admission.ExecutionCancellationToken.IsCancellationRequested.Should().BeTrue(
            "renewal store failure must cancel in-flight execute so the slot is not lost to lease TTL expiry while scan continues");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task ExecuteAsync_releases_concurrency_lease_when_renewal_store_fails_during_scan()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        ThrowingRenewLeaseStore store = new(inner);
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0, leaseDurationSeconds: 60));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 1,
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

        fixture.QuickScanService
            .Setup(q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .Returns(async (IReadOnlyDictionary<string, string> _, CancellationToken cancellationToken) =>
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);

                return new QuickScanResult { ScanId = "never" };
            });

        Task<QuickScanExecutionResult> executeTask = fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        await Task.Delay(TimeSpan.FromSeconds(2.5));

        QuickScanConcurrencyAdmitResult followUp = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0, leaseDurationSeconds: 60));

        followUp.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "renewal failure must cancel in-flight scan and release the slot before lease TTL expiry");

        QuickScanExecutionResult result = await executeTask;

        result.Succeeded.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync_can_retry_release_when_store_throws()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        ThrowingReleaseLeaseStore store = new(inner);
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        QuickScanDistributedConcurrencyAdmissionResult admission = QuickScanDistributedConcurrencyAdmissionResult.Permit(
            leaseId,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            new QuickScanGuardContext
            {
                ClientIp = "203.0.113.10",
                SessionId = "session",
                PayloadFingerprint = "trace",
                UseDistributedConcurrencyLimit = true,
            },
            CreateDefaultSafetyOptions().Object,
            TimeProvider.System,
            CancellationToken.None);

        Func<Task> firstDispose = async () => await admission.DisposeAsync();

        await firstDispose.Should().ThrowAsync<InvalidOperationException>(
            "transient release failures must remain retriable until the slot is freed");

        QuickScanConcurrencyAdmitResult followUpWhilePinned = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0));

        followUpWhilePinned.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Busy,
            "failed release must not mark the lease released before the store accepts ReleaseLeaseAsync");

        store.ReleaseShouldSucceed = true;

        await admission.DisposeAsync();

        QuickScanConcurrencyAdmitResult followUpAfterRetry = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "after-retry", maxConcurrent: 1, maxQueued: 0));

        followUpAfterRetry.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "a later dispose retry must release the slot after a transient store failure");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_abandons_queue_entry_when_promote_store_error_and_abandon_retries()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        FailOnceAbandonThrowingPromoteStore store = new(inner, queueEntryId);
        QuickScanDistributedConcurrencyService service = CreateService(store);

        QuickScanDistributedConcurrencyAdmissionResult result =
            await service.WaitForAdmissionAsync("queued-after-promote-error", CancellationToken.None);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.StoreUnavailable);

        QuickScanConcurrencyAdmitResult followUpQueue = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "after-promote-error", maxConcurrent: 1, maxQueued: 1));

        followUpQueue.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Queued,
            "promote store errors must still abandon the queue row when the first abandon attempt fails transiently");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_returns_store_unavailable_when_promote_and_abandon_both_fail()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        AlwaysThrowingAbandonThrowingPromoteStore store = new(inner, queueEntryId);
        QuickScanDistributedConcurrencyService service = CreateService(store);

        QuickScanDistributedConcurrencyAdmissionResult result =
            await service.WaitForAdmissionAsync("queued-after-promote-error", CancellationToken.None);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.StoreUnavailable);
    }

    [Fact]
    public async Task WaitForAdmissionAsync_still_throws_operation_canceled_when_abandon_cleanup_fails()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        AlwaysThrowingAbandonPromoteDelayStore store = new(inner);
        using CancellationTokenSource cancellation = new();
        QuickScanDistributedConcurrencyService service = CreateService(store);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-request", cancellation.Token);

        await Task.Delay(50);
        await cancellation.CancelAsync();

        Func<Task> act = () => waitTask;

        await act.Should().ThrowAsync<OperationCanceledException>(
            "caller cancellation must win even when queue abandon cleanup fails transiently");
    }

    [Fact]
    public async Task ExecutionCancellationToken_stays_active_when_renewal_interval_is_clamped_before_lease_expires()
    {
        InMemoryQuickScanDistributedConcurrencyStore store = new();
        Guid leaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await store.TryAdmitAsync(
            BuildAdmitRequest(leaseId, Guid.NewGuid(), "held", maxConcurrent: 1, maxQueued: 0, leaseDurationSeconds: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 2,
                LeaseRenewalIntervalSeconds = 3,
            },
        });

        QuickScanDistributedConcurrencyAdmissionResult admission = QuickScanDistributedConcurrencyAdmissionResult.Permit(
            leaseId,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            new QuickScanGuardContext
            {
                ClientIp = "203.0.113.10",
                SessionId = "session",
                PayloadFingerprint = "trace",
                UseDistributedConcurrencyLimit = true,
            },
            safetyOptions.Object,
            TimeProvider.System,
            CancellationToken.None);

        await Task.Delay(TimeSpan.FromSeconds(2.5));

        admission.ExecutionCancellationToken.IsCancellationRequested.Should().BeFalse(
            "renewal must run before lease TTL when configured interval exceeds lease duration");

        QuickScanConcurrencyAdmitResult followUp = await store.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "follow-up", maxConcurrent: 1, maxQueued: 0, leaseDurationSeconds: 2));

        followUp.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Busy,
            "clamp+immediate renewal must keep the slot held while execute is still running");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_uses_current_max_concurrent_limit_when_promoting_after_options_change()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        PromoteLimitObservingStore store = new(inner);
        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 2,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        List<Guid> activeLeaseIds = new();

        for (int index = 0; index < 2; index++)
        {
            Guid leaseId = Guid.NewGuid();

            QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
                BuildAdmitRequest(leaseId, Guid.NewGuid(), $"direct-{index}", maxConcurrent: 2, maxQueued: 2));

            direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);
            activeLeaseIds.Add(leaseId);
        }

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-limit-tighten", CancellationToken.None);

        await Task.Delay(50);

        await inner.ReleaseLeaseAsync(activeLeaseIds[0]);

        options.Concurrency.MaxConcurrentAnonymousScans = 1;

        await Task.Delay(500);

        store.ObservedPromoteMaxConcurrentScans.Should().Contain(
            1,
            "promote must read the tightened MaxConcurrentAnonymousScans instead of the limit captured at queue entry");

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeFalse();
        admission.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.QueueTimeout);

        QuickScanConcurrencyAdmitResult capacityProbe = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "capacity-probe", maxConcurrent: 2, maxQueued: 0));

        capacityProbe.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.DirectLease,
            "promote must not grant a second active lease when the tightened limit is 1");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_uses_current_max_concurrent_limit_on_promote_after_options_change()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        List<Guid> activeLeaseIds = new();

        for (int index = 0; index < 2; index++)
        {
            Guid leaseId = Guid.NewGuid();
            QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
                BuildAdmitRequest(leaseId, Guid.NewGuid(), $"active-{index}", maxConcurrent: 2, maxQueued: 2));
            direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);
            activeLeaseIds.Add(leaseId);
        }

        TaskCompletionSource promoteReached = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource releasePromote = new(TaskCreationOptions.RunContinuationsAsynchronously);

        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 2,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

        QuickScanDistributedConcurrencyAdmitLimitRefreshStore refreshStore =
            new(inner, safetyOptions.Object, TimeProvider.System);
        GatedPromoteStore store = new(refreshStore, promoteReached, releasePromote);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-promote-after-limit-tighten", CancellationToken.None);

        await Task.Delay(50);

        await inner.ReleaseLeaseAsync(activeLeaseIds[0]);

        await promoteReached.Task.WaitAsync(TimeSpan.FromSeconds(2));

        options.Concurrency.MaxConcurrentAnonymousScans = 1;
        releasePromote.SetResult();

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeFalse();
        admission.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.QueueTimeout);

        refreshStore.LastRefreshedPromoteMaxConcurrentScans.Should().Be(
            1,
            "TryPromote must re-read MaxConcurrentAnonymousScans at store entry after options tighten");

        QuickScanConcurrencyAdmitResult capacityProbe = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "capacity-probe", maxConcurrent: 1, maxQueued: 0));

        capacityProbe.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Busy,
            "promote must not grant a second active lease when the tightened limit is 1");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_uses_current_max_concurrent_limit_on_direct_admit_after_options_change()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult existing = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "existing", maxConcurrent: 2, maxQueued: 2));
        existing.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        TaskCompletionSource admitReached = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource releaseAdmit = new(TaskCreationOptions.RunContinuationsAsynchronously);

        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 2,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

        QuickScanDistributedConcurrencyAdmitLimitRefreshStore refreshStore =
            new(inner, safetyOptions.Object, TimeProvider.System);
        GatedAdmitStore store = new(refreshStore, admitReached, releaseAdmit);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("direct-after-limit-tighten", CancellationToken.None);

        await admitReached.Task.WaitAsync(TimeSpan.FromSeconds(2));

        options.Concurrency.MaxConcurrentAnonymousScans = 1;
        options.Concurrency.MaxQueuedAnonymousScans = 0;
        releaseAdmit.SetResult();

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeFalse();
        admission.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.Busy);

        refreshStore.LastRefreshedMaxConcurrentScans.Should().Be(
            1,
            "direct TryAdmit must re-read MaxConcurrentAnonymousScans like the promote loop (#1542)");

        QuickScanConcurrencyAdmitResult capacityProbe = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "capacity-probe", maxConcurrent: 1, maxQueued: 0));

        capacityProbe.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Busy,
            "tightened limit must not allow a second active lease on direct admit");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_propagates_operational_snapshot_failure_without_store_unavailable()
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
                QueueWaitTimeoutSeconds = 30,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated operational snapshot store failure."));

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            new InMemoryQuickScanDistributedConcurrencyStore(),
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Func<Task> act = () => service.WaitForAdmissionAsync("operational-failure", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>(
            "operational snapshot failures are not mapped to StoreUnavailable; only distributed store admit/promote errors are");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_uses_current_lease_duration_on_each_promote_attempt()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        PromoteLimitObservingStore store = new(inner);
        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-duration-change", CancellationToken.None);

        await Task.Delay(50);

        await inner.ReleaseLeaseAsync(activeLeaseId);

        options.Concurrency.LeaseDurationSeconds = 45;

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue();
        store.ObservedPromoteLeaseDurationSeconds.Should().Contain(
            TimeSpan.FromSeconds(45),
            "promote must re-read LeaseDurationSeconds each attempt, same as MaxConcurrentAnonymousScans (#1542)");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_still_promotes_when_max_queued_tightened_to_zero_during_queue_wait()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        List<Guid> activeLeaseIds = new();

        for (int index = 0; index < 2; index++)
        {
            Guid leaseId = Guid.NewGuid();
            QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
                BuildAdmitRequest(leaseId, Guid.NewGuid(), $"active-{index}", maxConcurrent: 2, maxQueued: 2));
            direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);
            activeLeaseIds.Add(leaseId);
        }

        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 2,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-max-queued-tighten", CancellationToken.None);

        await Task.Delay(50);

        options.Concurrency.MaxQueuedAnonymousScans = 0;
        await inner.ReleaseLeaseAsync(activeLeaseIds[0]);

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "an enqueued waiter is not evicted when MaxQueuedAnonymousScans is tightened; promote still honors refreshed max-concurrent limits");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_queue_timeout_frees_queue_capacity_when_abandon_noops_on_timed_out_row()
    {
        DateTimeOffset start = new(2026, 9, 26, 14, 0, 0, TimeSpan.Zero);
        SteppingTimeProvider timeProvider = new(start);
        InMemoryQuickScanDistributedConcurrencyStore inner = new();

        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
                QueueWaitTimeoutSeconds = 2,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            timeProvider,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(
                activeLeaseId,
                Guid.NewGuid(),
                "active",
                maxConcurrent: 1,
                maxQueued: 1,
                utcNow: start));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-until-timeout", CancellationToken.None);

        await Task.Delay(50);
        timeProvider.Advance(TimeSpan.FromSeconds(3));

        await Task.Delay(500);

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeFalse();
        admission.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.QueueTimeout);

        QuickScanConcurrencyAdmitResult followUpQueue = await inner.TryAdmitAsync(
            BuildAdmitRequest(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "after-queue-timeout",
                maxConcurrent: 1,
                maxQueued: 1,
                utcNow: timeProvider.GetUtcNow()));

        followUpQueue.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Queued,
            "TimedOut queue rows must not pin MaxQueuedAnonymousScans after QueueTimeout cleanup");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_still_promotes_when_safety_enabled_flips_false_during_queue_wait()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-enabled-off", CancellationToken.None);

        await Task.Delay(50);

        await inner.ReleaseLeaseAsync(activeLeaseId);
        options.Enabled = false;

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "promote loop polls store capacity only; budget-stage operational re-check and orchestrator dispose handle downstream kill-switch");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_keeps_queue_wait_deadline_captured_at_enqueue_when_options_shorten()
    {
        DateTimeOffset start = new(2026, 9, 26, 12, 0, 0, TimeSpan.Zero);
        SteppingTimeProvider timeProvider = new(start);
        InMemoryQuickScanDistributedConcurrencyStore inner = new();

        QuickScanSafetyOptions options = new()
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
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            timeProvider,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(
                activeLeaseId,
                Guid.NewGuid(),
                "active",
                maxConcurrent: 1,
                maxQueued: 2,
                utcNow: start));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-timeout-shorten", CancellationToken.None);

        await Task.Delay(50);

        timeProvider.Advance(TimeSpan.FromSeconds(5));
        options.Concurrency.QueueWaitTimeoutSeconds = 1;

        timeProvider.Advance(TimeSpan.FromSeconds(10));

        await inner.ReleaseLeaseAsync(activeLeaseId);

        await Task.Delay(300);

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "in-flight queue wait deadline is captured at enqueue; live QueueWaitTimeoutSeconds changes apply only to new waiters (#6960)");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_still_promotes_when_anonymous_execution_disabled_during_queue_wait()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 2));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-after-feature-off", CancellationToken.None);

        await Task.Delay(50);

        await inner.ReleaseLeaseAsync(activeLeaseId);
        options.AnonymousExecutionEnabled = false;

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "promote loop polls store capacity only; budget-stage operational re-check and orchestrator dispose handle downstream kill-switch");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_throws_operation_canceled_when_operational_snapshot_lookup_is_cancelled()
    {
        using CancellationTokenSource cancellation = new();
        await cancellation.CancelAsync();

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
                QueueWaitTimeoutSeconds = 30,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cancellation.Token));

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            new InMemoryQuickScanDistributedConcurrencyStore(),
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Func<Task> act = () => service.WaitForAdmissionAsync("cancelled-snapshot", cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_eventually_promotes_when_first_try_promote_is_delayed_and_lease_expires()
    {
        DateTimeOffset start = new(2026, 9, 26, 16, 0, 0, TimeSpan.Zero);
        SteppingTimeProvider timeProvider = new(start);
        InMemoryQuickScanDistributedConcurrencyStore inner = new();

        Guid activeLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult existing = await inner.TryAdmitAsync(
            new QuickScanConcurrencyAdmitRequest
            {
                LeaseId = activeLeaseId,
                QueueEntryId = Guid.NewGuid(),
                RequestKey = "expiring",
                HolderInstanceId = "test",
                UtcNow = start,
                MaxConcurrentScans = 1,
                MaxQueuedScans = 1,
                QueueWaitTimeout = TimeSpan.FromSeconds(30),
                LeaseDuration = TimeSpan.FromSeconds(5),
            });
        existing.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        TaskCompletionSource promoteReached = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource releasePromote = new(TaskCreationOptions.RunContinuationsAsynchronously);
        GatedPromoteStore store = new(inner, promoteReached, releasePromote);

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            timeProvider,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("queued-until-lease-expires", CancellationToken.None);

        await promoteReached.Task.WaitAsync(TimeSpan.FromSeconds(2));
        timeProvider.Advance(TimeSpan.FromSeconds(6));
        releasePromote.SetResult();

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "promote loop re-reads TimeProvider each poll so a delayed first TryPromote self-heals once the active lease expires");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_uses_current_utc_now_on_try_admit_after_operational_delay()
    {
        DateTimeOffset start = new(2026, 9, 26, 15, 0, 0, TimeSpan.Zero);
        SteppingTimeProvider timeProvider = new(start);
        InMemoryQuickScanDistributedConcurrencyStore inner = new();

        Guid expiredLeaseId = Guid.NewGuid();
        QuickScanConcurrencyAdmitResult existing = await inner.TryAdmitAsync(
            new QuickScanConcurrencyAdmitRequest
            {
                LeaseId = expiredLeaseId,
                QueueEntryId = Guid.NewGuid(),
                RequestKey = "expiring",
                HolderInstanceId = "test",
                UtcNow = start,
                MaxConcurrentScans = 1,
                MaxQueuedScans = 1,
                QueueWaitTimeout = TimeSpan.FromSeconds(30),
                LeaseDuration = TimeSpan.FromSeconds(5),
            });
        existing.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        TaskCompletionSource releaseOperationalLookup = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 0,
                QueueWaitTimeoutSeconds = 30,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                await releaseOperationalLookup.Task.ConfigureAwait(false);

                return new QuickScanSafetyOperationalSnapshot
                {
                    Mode = QuickScanSafetyOperationalMode.Normal,
                    AnonymousExecutionAllowed = true,
                    SampleResultAvailable = true,
                    PublicMessage = string.Empty,
                    StoreHealthy = true,
                };
            });

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            inner,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            timeProvider,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("after-lease-expired", CancellationToken.None);

        await Task.Delay(50);
        timeProvider.Advance(TimeSpan.FromSeconds(10));
        releaseOperationalLookup.SetResult();

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeTrue(
            "TryAdmit must use current UTC when evaluating expired leases, not the timestamp captured before operational/store delays");

        await admission.DisposeAsync();
    }

    [Fact]
    public async Task AdmitLimitRefreshStore_sets_admit_utc_now_from_time_provider()
    {
        DateTimeOffset start = new(2026, 9, 26, 17, 0, 0, TimeSpan.Zero);
        SteppingTimeProvider timeProvider = new(start);
        RecordingAdmitStore recording = new(new InMemoryQuickScanDistributedConcurrencyStore());

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
                QueueWaitTimeoutSeconds = 30,
                LeaseDurationSeconds = 60,
            },
        });

        QuickScanDistributedConcurrencyAdmitLimitRefreshStore refreshStore =
            new(recording, safetyOptions.Object, timeProvider);

        timeProvider.Advance(TimeSpan.FromSeconds(12));

        await refreshStore.TryAdmitAsync(new QuickScanConcurrencyAdmitRequest
        {
            LeaseId = Guid.NewGuid(),
            QueueEntryId = Guid.NewGuid(),
            RequestKey = "utc-refresh",
            HolderInstanceId = "test",
            UtcNow = start,
            MaxConcurrentScans = 1,
            MaxQueuedScans = 1,
            QueueWaitTimeout = TimeSpan.FromSeconds(30),
            LeaseDuration = TimeSpan.FromSeconds(60),
        });

        recording.LastRequest!.UtcNow.Should().Be(
            start + TimeSpan.FromSeconds(12),
            "admit refresh must stamp store entry with TimeProvider UTC (#6969), not the caller snapshot");
    }

    [Fact]
    public async Task AdmitLimitRefreshStore_preserves_queue_wait_timeout_from_request_when_options_change()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        RecordingAdmitStore recording = new(inner);

        QuickScanSafetyOptions options = new()
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 1,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

        QuickScanDistributedConcurrencyAdmitLimitRefreshStore refreshStore =
            new(recording, safetyOptions.Object, TimeProvider.System);

        TimeSpan capturedTimeout = TimeSpan.FromSeconds(30);
        QuickScanConcurrencyAdmitRequest request = new()
        {
            LeaseId = Guid.NewGuid(),
            QueueEntryId = Guid.NewGuid(),
            RequestKey = "refresh-timeout",
            HolderInstanceId = "test",
            UtcNow = DateTimeOffset.UtcNow,
            MaxConcurrentScans = 2,
            MaxQueuedScans = 2,
            QueueWaitTimeout = capturedTimeout,
            LeaseDuration = TimeSpan.FromSeconds(60),
        };

        options.Concurrency.QueueWaitTimeoutSeconds = 1;

        await refreshStore.TryAdmitAsync(request);

        recording.LastRequest!.QueueWaitTimeout.Should().Be(
            capturedTimeout,
            "limit refresh must not replace QueueWaitTimeout captured by WaitForAdmissionAsync at enqueue (#6960/#6966)");
    }

    [Fact]
    public async Task WaitForAdmissionAsync_returns_busy_when_refresh_applies_zero_max_queued_at_admit()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult existing = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "existing", maxConcurrent: 1, maxQueued: 2));
        existing.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        TaskCompletionSource admitReached = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource releaseAdmit = new(TaskCreationOptions.RunContinuationsAsynchronously);

        QuickScanSafetyOptions options = new()
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                MaxConcurrentAnonymousScans = 1,
                MaxQueuedAnonymousScans = 2,
                QueueWaitTimeoutSeconds = 5,
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        };

        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(() => options);

        QuickScanDistributedConcurrencyAdmitLimitRefreshStore refreshStore =
            new(inner, safetyOptions.Object, TimeProvider.System);
        GatedAdmitStore store = new(refreshStore, admitReached, releaseAdmit);

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

        QuickScanDistributedConcurrencyService service = new(
            safetyOptions.Object,
            store,
            Mock.Of<IQuickScanTelemetry>(),
            operational.Object,
            TimeProvider.System,
            NullLogger<QuickScanDistributedConcurrencyService>.Instance);

        Task<QuickScanDistributedConcurrencyAdmissionResult> waitTask =
            service.WaitForAdmissionAsync("busy-after-max-queued-zero", CancellationToken.None);

        await admitReached.Task.WaitAsync(TimeSpan.FromSeconds(2));
        options.Concurrency.MaxQueuedAnonymousScans = 0;
        releaseAdmit.SetResult();

        QuickScanDistributedConcurrencyAdmissionResult admission = await waitTask;

        admission.Allowed.Should().BeFalse();
        admission.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.Busy);
        refreshStore.LastRefreshedMaxConcurrentScans.Should().Be(1);
    }

    [Fact]
    public async Task WaitForAdmissionAsync_throws_operation_canceled_when_admit_is_cancelled()
    {
        using CancellationTokenSource cancellation = new();
        CancelingAdmitStore store = new();
        QuickScanDistributedConcurrencyService service = CreateService(store);

        await cancellation.CancelAsync();

        Func<Task> act = () => service.WaitForAdmissionAsync("cancelled-admit", cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task WaitForAdmissionAsync_store_error_on_admit_does_not_pin_queue_capacity()
    {
        InMemoryQuickScanDistributedConcurrencyStore inner = new();
        Guid activeLeaseId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult direct = await inner.TryAdmitAsync(
            BuildAdmitRequest(activeLeaseId, Guid.NewGuid(), "active", maxConcurrent: 1, maxQueued: 1));
        direct.Outcome.Should().Be(QuickScanConcurrencyAdmitOutcome.DirectLease);

        ThrowingAdmitStore store = new(inner);
        QuickScanDistributedConcurrencyService service = CreateService(store);

        QuickScanDistributedConcurrencyAdmissionResult result =
            await service.WaitForAdmissionAsync("queued-after-admit-error", CancellationToken.None);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanConcurrencyRejectionReason.StoreUnavailable);

        QuickScanConcurrencyAdmitResult followUpQueue = await inner.TryAdmitAsync(
            BuildAdmitRequest(Guid.NewGuid(), Guid.NewGuid(), "after-admit-error", maxConcurrent: 1, maxQueued: 1));

        followUpQueue.Outcome.Should().Be(
            QuickScanConcurrencyAdmitOutcome.Queued,
            "atomic admit must not leave a queue row when TryAdmitAsync throws before returning Queued");
    }

    private static Mock<IOptionsMonitor<QuickScanSafetyOptions>> CreateDefaultSafetyOptions()
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyOptions = new();
        safetyOptions.Setup(o => o.CurrentValue).Returns(new QuickScanSafetyOptions
        {
            Concurrency = new QuickScanSafetyConcurrencyLimits
            {
                LeaseDurationSeconds = 60,
                LeaseRenewalIntervalSeconds = 3600,
            },
        });

        return safetyOptions;
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
        int maxQueued,
        int leaseDurationSeconds = 60,
        DateTimeOffset? utcNow = null)
    {
        DateTimeOffset effectiveUtcNow = utcNow ?? TimeProvider.System.GetUtcNow();

        return new QuickScanConcurrencyAdmitRequest
        {
            LeaseId = leaseId,
            QueueEntryId = queueEntryId,
            RequestKey = requestKey,
            HolderInstanceId = "test-instance",
            UtcNow = effectiveUtcNow,
            MaxConcurrentScans = maxConcurrent,
            MaxQueuedScans = maxQueued,
            QueueWaitTimeout = TimeSpan.FromSeconds(30),
            LeaseDuration = TimeSpan.FromSeconds(leaseDurationSeconds),
        };
    }

    private sealed class RecordingAdmitStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public QuickScanConcurrencyAdmitRequest? LastRequest { get; private set; }

        public async Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default)
        {
            LastRequest = request;

            return await inner.TryAdmitAsync(request, cancellationToken).ConfigureAwait(false);
        }

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryPromoteAsync(request, cancellationToken);

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

    private sealed class SteppingTimeProvider(DateTimeOffset startUtc) : TimeProvider
    {
        private DateTimeOffset _utcNow = startUtc;

        public void Advance(TimeSpan delta) => _utcNow += delta;

        public override DateTimeOffset GetUtcNow() => _utcNow;
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
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);

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

    private sealed class ThrowingRenewLeaseStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryAdmitAsync(request, cancellationToken);

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryPromoteAsync(request, cancellationToken);

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            inner.ReleaseLeaseAsync(leaseId, cancellationToken);

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            inner.AbandonQueueEntryAsync(queueEntryId, cancellationToken);

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated renewal store failure.");
    }

    private sealed class ThrowingReleaseLeaseStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public bool ReleaseShouldSucceed { get; set; }

        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryAdmitAsync(request, cancellationToken);

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryPromoteAsync(request, cancellationToken);

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default)
        {
            if (!ReleaseShouldSucceed)
            {
                throw new InvalidOperationException("Simulated release store failure.");
            }

            return inner.ReleaseLeaseAsync(leaseId, cancellationToken);
        }

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            inner.AbandonQueueEntryAsync(queueEntryId, cancellationToken);

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
    }

    private sealed class AlwaysThrowingAbandonThrowingPromoteStore(InMemoryQuickScanDistributedConcurrencyStore inner, Guid queuedEntryId)
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

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated promote store failure.");

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            inner.ReleaseLeaseAsync(leaseId, cancellationToken);

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated abandon store failure.");

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
    }

    private sealed class AlwaysThrowingAbandonPromoteDelayStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryAdmitAsync(request, cancellationToken);

        public async Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);

            return QuickScanConcurrencyPromoteResult.NotYet();
        }

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            inner.ReleaseLeaseAsync(leaseId, cancellationToken);

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated abandon store failure.");

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
    }

    private sealed class FailOnceAbandonThrowingPromoteStore(InMemoryQuickScanDistributedConcurrencyStore inner, Guid queuedEntryId)
        : IQuickScanDistributedConcurrencyStore
    {
        private int _abandonAttempts;

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

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated promote store failure.");

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            inner.ReleaseLeaseAsync(leaseId, cancellationToken);

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default)
        {
            if (_abandonAttempts == 0)
            {
                _abandonAttempts++;

                throw new InvalidOperationException("Simulated abandon store failure.");
            }

            return inner.AbandonQueueEntryAsync(queueEntryId, cancellationToken);
        }

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
    }

    private sealed class PromoteLimitObservingStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public List<int> ObservedPromoteMaxConcurrentScans { get; } = [];

        public List<TimeSpan> ObservedPromoteLeaseDurationSeconds { get; } = [];

        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryAdmitAsync(request, cancellationToken);

        public async Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default)
        {
            ObservedPromoteMaxConcurrentScans.Add(request.MaxConcurrentScans);
            ObservedPromoteLeaseDurationSeconds.Add(request.LeaseDuration);

            return await inner.TryPromoteAsync(request, cancellationToken);
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

    private sealed class CancelingAdmitStore : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            throw new OperationCanceledException(cancellationToken);

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task RenewLeaseAsync(
            Guid leaseId,
            DateTimeOffset utcNow,
            TimeSpan leaseDuration,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();
    }

    private sealed class GatedPromoteStore(
        IQuickScanDistributedConcurrencyStore inner,
        TaskCompletionSource promoteReached,
        TaskCompletionSource releaseGate)
        : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryAdmitAsync(request, cancellationToken);

        public async Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default)
        {
            promoteReached.TrySetResult();

            await releaseGate.Task.WaitAsync(cancellationToken).ConfigureAwait(false);

            return await inner.TryPromoteAsync(request, cancellationToken).ConfigureAwait(false);
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

    private sealed class GatedAdmitStore(
        IQuickScanDistributedConcurrencyStore inner,
        TaskCompletionSource admitReached,
        TaskCompletionSource releaseGate)
        : IQuickScanDistributedConcurrencyStore
    {
        public async Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default)
        {
            admitReached.TrySetResult();

            await releaseGate.Task.WaitAsync(cancellationToken).ConfigureAwait(false);

            return await inner.TryAdmitAsync(request, cancellationToken).ConfigureAwait(false);
        }

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryPromoteAsync(request, cancellationToken);

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

    private sealed class ThrowingAdmitStore(InMemoryQuickScanDistributedConcurrencyStore inner)
        : IQuickScanDistributedConcurrencyStore
    {
        public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
            QuickScanConcurrencyAdmitRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated admit store failure.");

        public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
            QuickScanConcurrencyPromoteRequest request,
            CancellationToken cancellationToken = default) =>
            inner.TryPromoteAsync(request, cancellationToken);

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
