using ArchLucid.Application;

namespace ArchLucid.Application.Replay;

/// <summary>
///     Executes agents for a replay run created by <see cref="IReplayRunPrepareStage"/>.
/// </summary>
public interface IReplayRunExecutePreparedStage
{
    /// <summary>
    ///     Executes agents for a prepared replay run and optionally commits the result.
    /// </summary>
    Task<ReplayRunResult> ExecuteAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode = ExecutionModes.Current,
        bool commitReplay = false,
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default);
}
