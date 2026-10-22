using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Execute failure run header marking for partial-budget and agent-loop paths.
/// </summary>
public interface IArchitectureRunExecuteFailureRecorder
{
    Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        CancellationToken cancellationToken);

    Task TryMarkRunExecuteFailedAsync(
        string runId,
        AgentExecutionFailureSummary summary,
        IReadOnlyList<AgentResult>? completedResults,
        CancellationToken cancellationToken);
}
