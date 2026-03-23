using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Decisions;
using ArchiForge.Contracts.Requests;

namespace ArchiForge.DecisionEngine.Services;

public interface IDecisionEngineV2
{
    Task<IReadOnlyList<DecisionNode>> ResolveAsync(
        string runId,
        ArchitectureRequest request,
        IReadOnlyCollection<AgentTask> tasks,
        IReadOnlyCollection<AgentResult> results,
        IReadOnlyCollection<AgentEvaluation> evaluations,
        CancellationToken cancellationToken = default);
}
