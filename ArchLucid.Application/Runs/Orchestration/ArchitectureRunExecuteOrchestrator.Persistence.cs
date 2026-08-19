using System.Text.Json;

using System.Diagnostics;

using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Operations;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Transactional persistence of execute-phase evidence, results, and evaluations.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{

    /// <summary>
    ///     Persists evidence, results, and evaluations inside one transaction so retries do not duplicate rows.
    /// </summary>
    private async Task PersistExecutePhaseAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results, IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            await PersistExecutePhaseRowsAsync(evidence, results, evaluations, uow, cancellationToken);
            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }


    private async Task PersistExecutePhaseRowsAsync(AgentEvidencePackage evidence, IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations, IArchLucidUnitOfWork uow, CancellationToken cancellationToken)
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
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken,
                uow.Connection,
                uow.Transaction);
        }
        else
        {
            if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken);

            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }


    private async Task PersistPartialExecutePhaseAsync(
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        IReadOnlyList<AgentEvaluation> evaluations,
        CancellationToken cancellationToken)
    {
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            await PersistPartialExecutePhaseRowsAsync(evidence, results, evaluations, uow, cancellationToken);

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);

            throw;
        }
    }


    private async Task PersistPartialExecutePhaseRowsAsync(
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
                    agentEvidencePackageRepository, evidence, cancellationToken))
            {
                await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken, uow.Connection, uow.Transaction);
            }

            await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
                resultRepository,
                scope,
                results,
                cancellationToken,
                uow.Connection,
                uow.Transaction);

            if (evaluations.Count > 0)
            {
                await agentEvaluationRepository.CreateManyAsync(
                    DecisionRecordMapper.ToRecords(evaluations),
                    cancellationToken,
                    uow.Connection,
                    uow.Transaction);
            }

            return;
        }

        if (await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
                agentEvidencePackageRepository, evidence, cancellationToken))
        {
            await agentEvidencePackageRepository.CreateAsync(evidence, cancellationToken);
        }

        await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
            resultRepository,
            scope,
            results,
            cancellationToken);

        if (evaluations.Count > 0)
        {
            await agentEvaluationRepository.CreateManyAsync(
                DecisionRecordMapper.ToRecords(evaluations),
                cancellationToken);
        }
    }


    private async Task<RunRecord?> TryLoadRunHeaderForStampingAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        return await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);
    }


    private void StampTaskExecutionModesOnResults(IReadOnlyList<AgentResult> results, RunRecord? header)
    {
        bool isSimulatorHost = !_agentExecutionOptions.Value.Mode.Equals("Real", StringComparison.OrdinalIgnoreCase);
        bool realModeFellBackToSimulator = header?.RealModeFellBackToSimulator ?? false;

        AgentResultTaskExecutionModePersistStamper.EnsureStamped(
            results,
            _agentExecutionOptions.Value,
            realModeFellBackToSimulator,
            isSimulatorHost);
    }
}
