namespace ArchLucid.Host.Core.Hosted;

/// <summary>Starts leader-elected work only for workers that configuration has left enabled.</summary>
public static class HostLeaderElectionCoordinatorEnablementExtensions
{
    /// <summary>
    /// Runs <paramref name="leaderWork"/> under the lease when <paramref name="enabled"/> is true; otherwise invokes
    /// <paramref name="logDisabled"/> once and never competes for the lease.
    /// </summary>
    /// <remarks>
    /// A disabled worker that instead entered election and returned immediately would hold the lease for one cycle,
    /// release it, and be re-elected, producing an acquire/release pair plus two lease writes for the life of the host.
    /// </remarks>
    public static Task RunLeaderWorkWhenEnabledAsync(
        this HostLeaderElectionCoordinator electionCoordinator,
        bool enabled,
        Action logDisabled,
        string leaseName,
        Func<CancellationToken, Task> leaderWork,
        CancellationToken applicationStoppingToken)
    {
        ArgumentNullException.ThrowIfNull(electionCoordinator);
        ArgumentNullException.ThrowIfNull(logDisabled);

        if (!enabled)
        {
            logDisabled();

            return Task.CompletedTask;
        }

        return electionCoordinator.RunLeaderWorkAsync(leaseName, leaderWork, applicationStoppingToken);
    }
}
