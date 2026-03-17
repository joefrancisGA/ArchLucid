using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Decisions;

namespace ArchiForge.DecisionEngine.Services;

public interface IDecisionEngineV2
{
    Task<IReadOnlyList<DecisionNode>> ResolveAsync(
        string runId,
        IReadOnlyCollection<AgentResult> results,
        IReadOnlyCollection<AgentEvaluation> evaluations,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken = default);
}

