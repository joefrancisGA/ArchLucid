using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Execute idempotency checks and execute-completion legacy status promotion.
/// </summary>
public interface IArchitectureRunExecuteIdempotencyStage
{
    Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken);

    Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken);

    bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults);
}
