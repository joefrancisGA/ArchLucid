namespace ArchiForge.Application;

public interface IReplayRunService
{
    Task<ReplayRunResult> ReplayAsync(
        string originalRunId,
        string executionMode = "Current",
        bool commitReplay = false,
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default);
}
