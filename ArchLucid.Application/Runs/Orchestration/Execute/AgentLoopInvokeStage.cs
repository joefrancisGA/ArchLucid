using ArchLucid.Application.Decisions;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public sealed class AgentLoopInvokeStage(
    IScopeContextProvider scopeContextProvider,
    IAgentExecutor agentExecutor,
    IAgentEvaluationService agentEvaluationService,
    IArchitectureRunExecutePreExecuteStage preExecuteStage,
    IArchitectureRunExecutePersistenceStage persistenceStage,
    IArchitectureRunExecuteFailureRecorder failureRecorder,
    IRunScopedLlmBudgetReservationService runScopedLlmBudgetReservationService,
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IBaselineMutationAuditService baselineMutationAudit,
    ILogger<AgentLoopInvokeStage> logger) : IAgentLoopInvokeStage
{
    public async Task<IReadOnlyList<AgentResult>> InvokeAsync(AgentLoopPreparedBatch prepared, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prepared);
        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;
        RunScopedLlmBudgetAdmitResult budgetAdmit = await AdmitAsync(tenantId, prepared.RunId, prepared.Tasks.Count, cancellationToken);
        try
        {
            await preExecuteStage.ThrowIfCooperativeCancelRequestedAsync(prepared.RunId, cancellationToken);
            IReadOnlyList<AgentResult> results;
            try
            {
                using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
                    results = await agentExecutor.ExecuteAsync(prepared.RunId, prepared.Request, prepared.Evidence, prepared.Tasks, cancellationToken);
            }
            catch (AgentRunPartialBudgetException partial) when (agentOutputQualityGateOptions.Value.PersistPartialOutputsOnBudgetExceeded && partial.CompletedResults.Count > 0)
            {
                var evals = await agentEvaluationService.EvaluateAsync(prepared.RunId, prepared.Request, prepared.Evidence, prepared.Tasks, partial.CompletedResults, cancellationToken);
                await persistenceStage.PersistPartialExecutePhaseAsync(prepared.Evidence, partial.CompletedResults, evals, cancellationToken);
                var failure = AgentExecutionFailureSummaryFactory.FromException(partial.BudgetCause);
                await failureRecorder.TryMarkRunExecuteFailedAsync(prepared.RunId, failure, partial.CompletedResults, cancellationToken);
                await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, prepared.Actor, prepared.RunId, AgentExecutionFailureSummaryJson.Serialize(failure), cancellationToken);
                throw new RunCostBudgetExceededPartialPersistRecordedException(partial.BudgetCause, partial.CompletedResults.Count);
            }
            await FinalizeAsync(budgetAdmit, true, cancellationToken);
            if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(prepared.RunId, out Guid runId))
                logger.LogInformationAgentExecutionStateTransition(runId, "agent_batch_executing", "agent_results_persisting", prepared.ScheduledTaskIds);
            return results;
        }
        catch { await FinalizeAsync(budgetAdmit, false, cancellationToken); throw; }
    }

    private async Task<RunScopedLlmBudgetAdmitResult> AdmitAsync(Guid tenantId, string runId, int count, CancellationToken ct)
    {
        var admit = await runScopedLlmBudgetReservationService.AdmitBeforeAgentBatchAsync(tenantId, runId, count, ct);
        if (admit.Allowed) return admit;
        if (admit.RejectionReason == RunScopedLlmBudgetAdmitRejectionReason.Disabled) return admit;
        throw admit.RejectionReason switch
        {
            RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded => new CostLimitExceededException($"Run '{runId}' estimated agent-batch cost exceeds MaxCostPerRun / MaxTokensPerRun before execution."),
            RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded => new LlmTokenQuotaExceededException($"Run '{runId}' cannot start: tenant monthly LLM dollar budget lacks headroom for the estimated agent batch."),
            RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable => new InvalidOperationException($"Run '{runId}' cannot start: run-scoped LLM budget reservation store is unavailable."),
            
            _ => new InvalidOperationException($"Run '{runId}' cannot start: run-scoped LLM budget admission was rejected ({admit.RejectionReason})."),
        };
    }

    private async Task FinalizeAsync(RunScopedLlmBudgetAdmitResult admit, bool commit, CancellationToken ct)
    {
        if (!admit.ReservationHeld || admit.ReservationId is null) return;
        if (commit) await runScopedLlmBudgetReservationService.CommitAsync(admit.ReservationId.Value, admit.ReservedUsd, ct);
        else await runScopedLlmBudgetReservationService.ReleaseAsync(admit.ReservationId.Value, ct);
    }
}
