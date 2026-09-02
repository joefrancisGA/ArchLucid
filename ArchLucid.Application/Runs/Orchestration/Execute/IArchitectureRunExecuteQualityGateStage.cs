using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Quality-gate auto-retry and reject marking for execute orchestration.
/// </summary>
public interface IArchitectureRunExecuteQualityGateStage
{
    Task<IReadOnlyList<AgentResult>> RunQualityGateTraceEvaluationLoopAsync(
        string runId,
        string actor,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> initialResults,
        CancellationToken cancellationToken);
}
