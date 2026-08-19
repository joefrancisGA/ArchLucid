namespace ArchLucid.Core.Hosting;

/// <summary>Runs work only on the elected host replica when leader election is enabled.</summary>
public interface ILeaderElectionWorkRunner
{
    Task RunLeaderWorkAsync(
        string leaseName,
        Func<CancellationToken, Task> leaderWork,
        CancellationToken applicationStoppingToken);
}
