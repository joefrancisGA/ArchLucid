using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LeaderElectionWorkRunnerTests
{
    [Fact]
    public async Task RunLeaderWorkAsync_invokes_coordinator_with_same_arguments()
    {
        bool ran = false;

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
        electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

        HostLeaderElectionCoordinator coordinator = new(
            electionOpts.Object,
            new NoOpHostLeaderLeaseRepository(),
            HostInstanceIdentifier.ForTests("host-core-runner-tests"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        LeaderElectionWorkRunner sut = new(coordinator);
        CancellationTokenSource cts = new();

        await sut.RunLeaderWorkAsync(
            "test-lease",
            _ =>
            {
                ran = true;

                return Task.CompletedTask;
            },
            cts.Token);

        ran.Should().BeTrue();
    }

    [Fact]
    public void Ctor_throws_when_coordinator_null() =>
        Assert.Throws<ArgumentNullException>(() => new LeaderElectionWorkRunner(null!));
}
