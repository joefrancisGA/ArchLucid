namespace ArchLucid.Application.Replay;

/// <summary>
///     Creates replay run records and cloned tasks without executing agents.
/// </summary>
public interface IReplayRunPrepareStage
{
    /// <summary>
    ///     Creates the replay run record and cloned tasks for <paramref name="originalRunId"/>.
    /// </summary>
    Task<string> PrepareAsync(string originalRunId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Returns whether the source run has persisted authority stage outcomes.
    /// </summary>
    Task<bool> SourceRunHasAuthorityStageProgressAsync(string originalRunId, CancellationToken cancellationToken = default);
}
