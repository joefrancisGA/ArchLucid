using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecutePersistRowsStage" />
public sealed class ArchitectureRunExecutePersistRowsStage(
    IScopeContextProvider scopeContextProvider,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentResultRepository resultRepository,
    IAgentEvaluationRepository agentEvaluationRepository,
    IRunRepository runRepository,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor) : IArchitectureRunExecutePersistRowsStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IAgentResultRepository _resultRepository =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IAgentEvaluationRepository _agentEvaluationRepository =
        agentEvaluationRepository ?? throw new ArgumentNullException(nameof(agentEvaluationRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    /// <inheritdoc />
    public async Task PersistExecutePhaseRowsAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (results.Count > 0)
        {
            RunRecord? header = await TryLoadRunHeaderForStampingAsync(results[0].RunId, scope, cancellationToken);
            StampTaskExecutionModesOnResults(results, header);
        }

        if (uow.SupportsExternalTransaction)
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    _agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await _agentEvidencePackageRepository.CreateAsync(
                    evidence,
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                _resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            await _agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken,
                uow.Connection,
                uow.Transaction);
        }
        else
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    _agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await _agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                _resultRepository,
                scope,
                results,
                cancellationToken);

            await _agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task PersistPartialExecutePhaseRowsAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(evaluations);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (uow.SupportsExternalTransaction)
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    _agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await _agentEvidencePackageRepository.CreateAsync(
                    evidence,
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                _resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            if (evaluations.Count > 0)
            {
                await _agentEvaluationRepository.CreateManyAsync(
                    DecisionRecordMapper.ToRecords(evaluations),
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            }

            return;
        }

        if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                _agentEvidencePackageRepository, evidence, cancellationToken))
        {
            await _agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
        }

        await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
            _resultRepository,
            scope,
            results,
            cancellationToken);

        if (evaluations.Count > 0)
        {
            await _agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return null;

        return await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);
    }

    /// <inheritdoc />
    public void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header)
    {
        bool isSimulatorHost = !EffectiveAgentExecutionOptions().Mode.Equals("Real", StringComparison.OrdinalIgnoreCase);
        bool realModeFellBackToSimulator = header?.RealModeFellBackToSimulator ?? false;

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            results,
            EffectiveAgentExecutionOptions(),
            realModeFellBackToSimulator,
            isSimulatorHost);
    }

    private AgentExecutionOptions EffectiveAgentExecutionOptions()
    {
        return new AgentExecutionOptions
        {
            Mode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
        };
    }
}
