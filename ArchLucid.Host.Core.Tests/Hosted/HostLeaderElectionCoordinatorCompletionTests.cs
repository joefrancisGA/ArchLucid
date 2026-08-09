using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

/// <summary>Leader work that finishes on its own must end the election loop instead of re-competing.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostLeaderElectionCoordinatorCompletionTests
{
    private const int RenewIntervalSeconds = 10;

    [Fact]
    public async Task RunLeaderWorkAsync_when_work_returns_while_leader_releases_promptly_without_reacquiring()
    {
        Mock<IHostLeaderLeaseRepository> lease = new();
        lease
            .Setup(l => l.TryAcquireOrRenewAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions
        {
            Enabled = true,
            LeaseDurationSeconds = 60,
            RenewIntervalSeconds = RenewIntervalSeconds,
            FollowerPollMilliseconds = 50,
        });

        HostLeaderElectionCoordinator sut = new(
            options.Object,
            lease.Object,
            HostInstanceIdentifier.ForTests("leader-a"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        using CancellationTokenSource app = new(TimeSpan.FromSeconds(60));
        long startedTicks = Environment.TickCount64;

        // Returns immediately, the way a worker disabled by configuration does.
        await sut.RunLeaderWorkAsync("test-lease", _ => Task.CompletedTask, app.Token);

        long elapsedMs = Environment.TickCount64 - startedTicks;

        // Must not block on the pending renew delay before releasing.
        elapsedMs.Should().BeLessThan(RenewIntervalSeconds * 1000);

        lease.Verify(
            l => l.TryAcquireOrRenewAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        lease.Verify(
            l => l.TryReleaseAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
