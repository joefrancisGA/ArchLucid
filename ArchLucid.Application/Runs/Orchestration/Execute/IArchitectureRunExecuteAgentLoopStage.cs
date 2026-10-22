using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Agent batch execution, budget reservation, post-batch enrichment, and completion promotion.
/// </summary>
public interface IArchitectureRunExecuteAgentLoopStage
{
    Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken);
}
