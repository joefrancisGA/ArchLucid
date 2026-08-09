using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostLeaderElectionCoordinatorEnablementExtensionsTests
{
    [Fact]
    public async Task RunLeaderWorkWhenEnabledAsync_when_disabled_logs_once_and_skips_lease_acquisition()
    {
        Mock<IHostLeaderLeaseRepository> lease = new(MockBehavior.Strict);
        int disabledLogs = 0;
        bool workRan = false;

        await CreateCoordinator(lease.Object).RunLeaderWorkWhenEnabledAsync(
            false,
            () => disabledLogs++,
            "test-lease",
            _ =>
            {
                workRan = true;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        disabledLogs.Should().Be(1);
        workRan.Should().BeFalse();
        lease.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RunLeaderWorkWhenEnabledAsync_when_enabled_runs_leader_work()
    {
        Mock<IHostLeaderLeaseRepository> lease = new();
        lease
            .Setup(l => l.TryAcquireOrRenewAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        int disabledLogs = 0;
        bool workRan = false;

        await CreateCoordinator(lease.Object).RunLeaderWorkWhenEnabledAsync(
            true,
            () => disabledLogs++,
            "test-lease",
            _ =>
            {
                workRan = true;

                return Task.CompletedTask;
            },
            CancellationToken.None);

        disabledLogs.Should().Be(0);
        workRan.Should().BeTrue();
    }

    private static HostLeaderElectionCoordinator CreateCoordinator(IHostLeaderLeaseRepository leaseRepository)
    {
        Mock<IOptionsMonitor<HostLeaderElectionOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions
        {
            Enabled = true, LeaseDurationSeconds = 60, RenewIntervalSeconds = 10, FollowerPollMilliseconds = 50
        });

        return new HostLeaderElectionCoordinator(
            options.Object,
            leaseRepository,
            HostInstanceIdentifier.ForTests("host-core-tests"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);
    }
}
