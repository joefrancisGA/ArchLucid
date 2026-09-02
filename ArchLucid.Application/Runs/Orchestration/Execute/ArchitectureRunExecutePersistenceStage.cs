using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecutePersistenceStage" />
public sealed class ArchitectureRunExecutePersistenceStage(
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IArchitectureRunExecutePersistRowsStage persistRowsStage) : IArchitectureRunExecutePersistenceStage
{
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IArchitectureRunExecutePersistRowsStage _persistRowsStage =
        persistRowsStage ?? throw new ArgumentNullException(nameof(persistRowsStage));

    /// <inheritdoc />
    public async Task PersistExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            await _persistRowsStage.PersistExecutePhaseRowsAsync(evidence, results, evaluations, uow, cancellationToken);
            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task PersistPartialExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            await _persistRowsStage.PersistPartialExecutePhaseRowsAsync(
                evidence,
                results,
                evaluations,
                uow,
                cancellationToken);
            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <inheritdoc />
    public Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken) =>
        _persistRowsStage.TryLoadRunHeaderForStampingAsync(runId, scope, cancellationToken);

    /// <inheritdoc />
    public void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header) =>
        _persistRowsStage.StampTaskExecutionModesOnResults(results, header);
}
