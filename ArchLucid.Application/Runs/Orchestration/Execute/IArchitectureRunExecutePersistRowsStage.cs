using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Row-level persistence for execute-phase evidence, results, and evaluations.
/// </summary>
public interface IArchitectureRunExecutePersistRowsStage
{
    Task PersistExecutePhaseRowsAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken);

    Task PersistPartialExecutePhaseRowsAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken);

    Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken);

    void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header);
}
