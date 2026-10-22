using System.Data;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Runs;

/// <summary>Persists authority pipeline per-stage start/end outcomes (TB-250).</summary>
public interface IRunStageOutcomesRepository
{
    /// <summary>Inserts or resets a stage row to <c>running</c> at stage start.</summary>
    Task RecordStageStartedAsync(
        Guid runId,
        string stageName,
        DateTime startedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>Updates completion time and terminal outcome for a stage.</summary>
    Task RecordStageCompletedAsync(
        Guid runId,
        string stageName,
        string outcomeStatus,
        DateTime completedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>Lists stage rows for a run ordered by <see cref="StageTimelineSummary.StartedUtc" /> ascending.</summary>
    Task<IReadOnlyList<StageTimelineSummary>> ListByRunIdAsync(
        Guid runId,
        CancellationToken cancellationToken = default);
}
