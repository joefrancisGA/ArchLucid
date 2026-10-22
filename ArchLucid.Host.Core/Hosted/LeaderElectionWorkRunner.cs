using ArchLucid.Core.Hosting;

namespace ArchLucid.Host.Core.Hosted;

public sealed class LeaderElectionWorkRunner(HostLeaderElectionCoordinator coordinator) : ILeaderElectionWorkRunner
{
    private readonly HostLeaderElectionCoordinator _coordinator =
        coordinator ?? throw new ArgumentNullException(nameof(coordinator));

    public Task RunLeaderWorkAsync(
        string leaseName,
        Func<CancellationToken, Task> leaderWork,
        CancellationToken applicationStoppingToken)
        => _coordinator.RunLeaderWorkAsync(leaseName, leaderWork, applicationStoppingToken);
}
