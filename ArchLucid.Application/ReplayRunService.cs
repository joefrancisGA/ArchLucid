using ArchLucid.Application.Replay;

namespace ArchLucid.Application;

/// <summary>
///     Replays an existing architecture run by delegating to staged prepare, execute, and commit handlers.
/// </summary>
public sealed class ReplayRunService(
    IReplayRunPrepareStage prepareStage,
    IReplayRunExecutePreparedStage executePreparedStage) : IReplayRunService
{
    private readonly IReplayRunPrepareStage _prepareStage =
        prepareStage ?? throw new ArgumentNullException(nameof(prepareStage));

    private readonly IReplayRunExecutePreparedStage _executePreparedStage =
        executePreparedStage ?? throw new ArgumentNullException(nameof(executePreparedStage));

    /// <inheritdoc />
    public async Task<ReplayRunResult> ReplayAsync(
        string originalRunId,
        string executionMode = ExecutionModes.Current,
        bool commitReplay = false,
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default)
    {
        string replayRunId = await PrepareReplayRunAsync(originalRunId, cancellationToken);

        return await ExecutePreparedReplayAsync(
            replayRunId,
            originalRunId,
            executionMode,
            commitReplay,
            manifestVersionOverride,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<string> PrepareReplayRunAsync(string originalRunId, CancellationToken cancellationToken = default) =>
        _prepareStage.PrepareAsync(originalRunId, cancellationToken);

    /// <inheritdoc />
    public Task<ReplayRunResult> ExecutePreparedReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode = ExecutionModes.Current,
        bool commitReplay = false,
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default) =>
        _executePreparedStage.ExecuteAsync(
            preparedReplayRunId,
            originalRunId,
            executionMode,
            commitReplay,
            manifestVersionOverride,
            cancellationToken);
}
