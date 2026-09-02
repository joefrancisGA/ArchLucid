using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Transactional persistence of execute-phase evidence, results, and evaluations.
/// </summary>
public interface IArchitectureRunExecutePersistenceStage
{
    Task PersistExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken);

    Task PersistPartialExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken);

    Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken);

    void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header);
}
