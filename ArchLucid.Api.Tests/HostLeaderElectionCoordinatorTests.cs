using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostLeaderElectionCoordinatorTests
{
    [SkippableFact]
    public async Task RunLeaderWorkAsync_when_disabled_does_not_call_lease_repository()
    {
        Mock<IHostLeaderLeaseRepository> lease = new();
        Mock<IOptionsMonitor<HostLeaderElectionOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

        HostLeaderElectionCoordinator sut = new(
            options.Object,
            lease.Object,
            HostInstanceIdentifier.ForTests("instance-a"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        using CancellationTokenSource app = new();
        app.CancelAfter(150);

        await sut.RunLeaderWorkAsync(
            "test-lease",
            async ct =>
            {
                while (!ct.IsCancellationRequested)
                {
                    await Task.Delay(30, ct);
                }
            },
            app.Token);

        lease.Verify(
            l => l.TryAcquireOrRenewAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task RunLeaderWorkAsync_when_renewal_fails_cancels_leader_work()
    {
        int callSequence = 0;
        Mock<IHostLeaderLeaseRepository> lease = new();
        lease
            .Setup(l => l.TryAcquireOrRenewAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                callSequence++;

                // Initial acquire, then one successful renew, then renewal failure (lost lease).
                return callSequence <= 2;
            });

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions
        {
            Enabled = true, LeaseDurationSeconds = 60, RenewIntervalSeconds = 1, FollowerPollMilliseconds = 50
        });

        HostLeaderElectionCoordinator sut = new(
            options.Object,
            lease.Object,
            HostInstanceIdentifier.ForTests("leader-a"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        int loopTicks = 0;
        using CancellationTokenSource app = new(TimeSpan.FromSeconds(12));

        await sut.RunLeaderWorkAsync(
            "test-lease",
            async ct =>
            {
                while (!ct.IsCancellationRequested)
                {
                    loopTicks++;
                    await Task.Delay(50, ct);
                }
            },
            app.Token);

        loopTicks.Should().BeGreaterThan(0);
        callSequence.Should().BeGreaterThanOrEqualTo(3);
    }

    [SkippableFact]
    public async Task RunLeaderWorkAsync_two_hosts_contending_only_one_active_at_a_time()
    {
        ContendingLeaseRepository leaseRepository = new();

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions
        {
            Enabled = true,
            LeaseDurationSeconds = 60,
            RenewIntervalSeconds = 5,
            FollowerPollMilliseconds = 25,
        });

        HostLeaderElectionCoordinator leaderA = new(
            options.Object,
            leaseRepository,
            HostInstanceIdentifier.ForTests("instance-a"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        HostLeaderElectionCoordinator leaderB = new(
            options.Object,
            leaseRepository,
            HostInstanceIdentifier.ForTests("instance-b"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        using CancellationTokenSource app = new(TimeSpan.FromSeconds(4));
        int leaderATicks = 0;
        int leaderBTicks = 0;

        Task leaderATask = leaderA.RunLeaderWorkAsync(
            "contention-lease",
            async ct =>
            {
                while (!ct.IsCancellationRequested)
                {
                    Interlocked.Increment(ref leaderATicks);
                    await Task.Delay(40, ct);
                }
            },
            app.Token);

        Task leaderBTask = leaderB.RunLeaderWorkAsync(
            "contention-lease",
            async ct =>
            {
                while (!ct.IsCancellationRequested)
                {
                    Interlocked.Increment(ref leaderBTicks);
                    await Task.Delay(40, ct);
                }
            },
            app.Token);

        await Task.Delay(250);

        int snapshotA = Volatile.Read(ref leaderATicks);
        int snapshotB = Volatile.Read(ref leaderBTicks);
        (snapshotA > 0 ^ snapshotB > 0).Should().BeTrue("exactly one replica should hold the lease mid-run");

        app.Cancel();
        await Task.WhenAll(leaderATask, leaderBTask);
    }

    /// <summary>Thread-safe single-holder lease used to simulate two replicas contending.</summary>
    private sealed class ContendingLeaseRepository : IHostLeaderLeaseRepository
    {
        private readonly object _gate = new();

        private string? _holderInstanceId;

        public Task<bool> TryAcquireOrRenewAsync(
            string leaseName,
            string instanceId,
            int leaseDurationSeconds,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                if (_holderInstanceId is null || string.Equals(_holderInstanceId, instanceId, StringComparison.Ordinal))
                {
                    _holderInstanceId = instanceId;

                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
        }

        public Task TryReleaseAsync(string leaseName, string instanceId, CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                if (string.Equals(_holderInstanceId, instanceId, StringComparison.Ordinal))
                    _holderInstanceId = null;
            }

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<HostLeaderLeaseSnapshot>> ListAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<HostLeaderLeaseSnapshot>>([]);
        }
    }
}
