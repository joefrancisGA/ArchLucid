using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteAgentLoopStage" />
public sealed class ArchitectureRunExecuteAgentLoopStage(
    IArchitectureRequestRepository requestRepository,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IEvidenceBuilder evidenceBuilder,
    IEvidencePackageInjectionMitigator evidencePackageInjectionMitigator,
    IAgentEvidenceUntrustedInputSanitizer agentEvidenceUntrustedInputSanitizer,
    IAgentExecutor agentExecutor,
    IAgentEvaluationService agentEvaluationService,
    IAgentResultPostExecutionEnricher agentResultPostExecutionEnricher,
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IArchitectureRunExecutePreExecuteStage preExecuteStage,
    IArchitectureRunExecutePersistenceStage persistenceStage,
    IArchitectureRunExecuteQualityGateStage qualityGateStage,
    IArchitectureRunExecuteFailureRecorder failureRecorder,
    IRunScopedLlmBudgetReservationService runScopedLlmBudgetReservationService,
    IRunEngineProvenanceCaptureService runEngineProvenanceCaptureService,
    IExecuteTimeGovernanceScopeCaptureService executeTimeGovernanceScopeCaptureService,
    TechnologyLedgerTopologyProposalSeeder technologyLedgerTopologyProposalSeeder,
    IBaselineMutationAuditService baselineMutationAudit,
    ILogger<ArchitectureRunExecuteAgentLoopStage> logger) : IArchitectureRunExecuteAgentLoopStage
{
    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IEvidenceBuilder _evidenceBuilder =
        evidenceBuilder ?? throw new ArgumentNullException(nameof(evidenceBuilder));

    private readonly IEvidencePackageInjectionMitigator _evidencePackageInjectionMitigator =
        evidencePackageInjectionMitigator ?? throw new ArgumentNullException(nameof(evidencePackageInjectionMitigator));

    private readonly IAgentEvidenceUntrustedInputSanitizer _agentEvidenceUntrustedInputSanitizer =
        agentEvidenceUntrustedInputSanitizer ?? throw new ArgumentNullException(nameof(agentEvidenceUntrustedInputSanitizer));

    private readonly IAgentExecutor _agentExecutor =
        agentExecutor ?? throw new ArgumentNullException(nameof(agentExecutor));

    private readonly IAgentEvaluationService _agentEvaluationService =
        agentEvaluationService ?? throw new ArgumentNullException(nameof(agentEvaluationService));

    private readonly IAgentResultPostExecutionEnricher _agentResultPostExecutionEnricher =
        agentResultPostExecutionEnricher ?? throw new ArgumentNullException(nameof(agentResultPostExecutionEnricher));

    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly IArchitectureRunExecutePreExecuteStage _preExecuteStage =
        preExecuteStage ?? throw new ArgumentNullException(nameof(preExecuteStage));

    private readonly IArchitectureRunExecutePersistenceStage _persistenceStage =
        persistenceStage ?? throw new ArgumentNullException(nameof(persistenceStage));

    private readonly IArchitectureRunExecuteQualityGateStage _qualityGateStage =
        qualityGateStage ?? throw new ArgumentNullException(nameof(qualityGateStage));

    private readonly IArchitectureRunExecuteFailureRecorder _failureRecorder =
        failureRecorder ?? throw new ArgumentNullException(nameof(failureRecorder));

    private readonly IRunScopedLlmBudgetReservationService _runScopedLlmBudgetReservationService =
        runScopedLlmBudgetReservationService ?? throw new ArgumentNullException(nameof(runScopedLlmBudgetReservationService));

    private readonly IRunEngineProvenanceCaptureService _runEngineProvenanceCaptureService =
        runEngineProvenanceCaptureService ?? throw new ArgumentNullException(nameof(runEngineProvenanceCaptureService));

    private readonly IExecuteTimeGovernanceScopeCaptureService _executeTimeGovernanceScopeCaptureService =
        executeTimeGovernanceScopeCaptureService ?? throw new ArgumentNullException(nameof(executeTimeGovernanceScopeCaptureService));

    private readonly TechnologyLedgerTopologyProposalSeeder _technologyLedgerTopologyProposalSeeder =
        technologyLedgerTopologyProposalSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerTopologyProposalSeeder));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly ILogger<ArchitectureRunExecuteAgentLoopStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        RequestContentSafetyResult safety = await _requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);

        if (!safety.IsAllowed)
            throw new RequestContentSafetyRejectedException(safety.Reasons);

        using (PilotModeGovernanceScope.BeginFromPolicyReferences(request.PolicyReferences, request.CloudProvider))
        {
            ScopeContext executeScope = _scopeContextProvider.GetCurrentScope();
            IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(executeScope, runId, cancellationToken);

            if (tasks.Count == 0)
                throw new InvalidOperationException($"No tasks found for run '{runId}'.");
            AgentEvidencePackage evidence = await _evidenceBuilder.BuildAsync(runId, request, cancellationToken);

            await _evidencePackageInjectionMitigator.RedactKnownInjectionPatternsAsync(evidence, cancellationToken);

            await _agentEvidenceUntrustedInputSanitizer.SanitizeAsync(evidence, request, cancellationToken);

            string scheduledTaskIds = AgentExecutionStateTransitionTaskIds.Format(tasks.ToList());

            if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid executeTransitionRunId))
            {
                _logger.LogInformationAgentExecutionStateTransition(
                    executeTransitionRunId,
                    "execute_enter",
                    "agent_batch_executing",
                    scheduledTaskIds);
            }

            Guid tenantId = executeScope.TenantId;
            RunScopedLlmBudgetAdmitResult budgetAdmit =
                await AdmitRunScopedLlmBudgetOrThrowAsync(tenantId, runId, tasks.Count, cancellationToken);

            IReadOnlyList<AgentResult> results;

            try
            {
                await _preExecuteStage.ThrowIfCooperativeCancelRequestedAsync(runId, cancellationToken);

                try
                {
                    using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
                    {
                        results = await _agentExecutor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
                    }
                }
                catch (AgentRunPartialBudgetException partial)
                    when (_agentOutputQualityGateOptions.Value.PersistPartialOutputsOnBudgetExceeded &&
                          partial.CompletedResults.Count > 0)
                {
                    IReadOnlyList<AgentEvaluation> partialEvaluations =
                        await _agentEvaluationService.EvaluateAsync(
                            runId,
                            request,
                            evidence,
                            tasks,
                            partial.CompletedResults,
                            cancellationToken);

                    await _persistenceStage.PersistPartialExecutePhaseAsync(
                        evidence,
                        partial.CompletedResults,
                        partialEvaluations,
                        cancellationToken);

                    AgentExecutionFailureSummary partialFailure =
                        AgentExecutionFailureSummaryFactory.FromException(partial.BudgetCause);

                    await _failureRecorder.TryMarkRunExecuteFailedAsync(
                        runId,
                        partialFailure,
                        partial.CompletedResults,
                        cancellationToken);

                    await _baselineMutationAudit.RecordAsync(
                        AuditEventTypes.Baseline.Architecture.RunFailed,
                        actor,
                        runId,
                        AgentExecutionFailureSummaryJson.Serialize(partialFailure),
                        cancellationToken);

                    throw new RunCostBudgetExceededPartialPersistRecordedException(
                        partial.BudgetCause,
                        partial.CompletedResults.Count);
                }

                await FinalizeRunScopedLlmBudgetReservationAsync(
                    budgetAdmit,
                    commitReservation: true,
                    cancellationToken);
            }
            catch
            {
                await FinalizeRunScopedLlmBudgetReservationAsync(
                    budgetAdmit,
                    commitReservation: false,
                    cancellationToken);

                throw;
            }

            if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid afterBatchRunId))
            {
                _logger.LogInformationAgentExecutionStateTransition(
                    afterBatchRunId,
                    "agent_batch_executing",
                    "agent_results_persisting",
                    scheduledTaskIds);
            }

            await _agentResultPostExecutionEnricher
                .EnrichAsync(runId, request, evidence, results, cancellationToken)
                .ConfigureAwait(false);

            await TrySeedTechnologyLedgerFromTopologyAsync(runId, request, results, cancellationToken);

            IReadOnlyList<AgentEvaluation> evaluations =
                await _agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
            await _persistenceStage.PersistExecutePhaseAsync(evidence, results, evaluations, cancellationToken);

            if (ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid afterPersistRunId))
            {
                _logger.LogInformationAgentExecutionStateTransition(
                    afterPersistRunId,
                    "agent_results_persisting",
                    "execute_complete",
                    scheduledTaskIds);
            }

            results = await _qualityGateStage.RunQualityGateTraceEvaluationLoopAsync(
                runId,
                actor,
                request,
                evidence,
                tasks,
                results,
                cancellationToken);

            await TryPersistEngineProvenanceAsync(runId, evidence, cancellationToken);
            await TryPersistGovernanceScopeAsync(runId, request, cancellationToken);
            await _preExecuteStage.TryApplyExecuteCompletionLegacyStatusAsync(runId, results, cancellationToken);
            await _baselineMutationAudit.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded,
                actor,
                runId,
                $"ResultCount={results.Count}",
                cancellationToken);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Architecture run execution completed: RunId={RunId}, ResultCount={ResultCount}",
                    LogSanitizer.Sanitize(runId),
                    results.Count);
            }

            return new ExecuteRunResult { RunId = runId, Results = results.ToList() };
        }
    }

    private async Task TryPersistEngineProvenanceAsync(
        string runId,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken)
    {
        try
        {
            await _runEngineProvenanceCaptureService
                .TryCaptureAndPersistAsync(runId, evidence, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Engine provenance capture failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    private async Task TryPersistGovernanceScopeAsync(
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _executeTimeGovernanceScopeCaptureService
                .TryCaptureAndPersistAsync(runId, request, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Governance scope capture failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    private async Task TrySeedTechnologyLedgerFromTopologyAsync(
        string runId,
        ArchitectureRequest request,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        AgentResult? topologyResult = results.FirstOrDefault(result => result.AgentType == AgentType.Topology);

        if (topologyResult is null)
            return;

        try
        {
            await _technologyLedgerTopologyProposalSeeder
                .SeedFromTopologyResultAsync(runId, request, topologyResult, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Technology Ledger topology proposal seeding failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    private async Task<RunScopedLlmBudgetAdmitResult> AdmitRunScopedLlmBudgetOrThrowAsync(
        Guid tenantId,
        string runId,
        int agentTaskCount,
        CancellationToken cancellationToken)
    {
        RunScopedLlmBudgetAdmitResult admit = await _runScopedLlmBudgetReservationService
            .AdmitBeforeAgentBatchAsync(tenantId, runId, agentTaskCount, cancellationToken);

        if (admit.Allowed)
            return admit;

        return admit.RejectionReason switch
        {
            RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded =>
                throw new CostLimitExceededException(
                    $"Run '{runId}' estimated agent-batch cost exceeds MaxCostPerRun / MaxTokensPerRun before execution."),
            RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded =>
                throw new LlmTokenQuotaExceededException(
                    $"Run '{runId}' cannot start: tenant monthly LLM dollar budget lacks headroom for the estimated agent batch."),
            RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget reservation store is unavailable."),
            RunScopedLlmBudgetAdmitRejectionReason.Disabled =>
                admit,
            null =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget admission was rejected."),
            _ =>
                throw new InvalidOperationException(
                    $"Run '{runId}' cannot start: run-scoped LLM budget admission was rejected ({admit.RejectionReason})."),
        };
    }

    private async Task FinalizeRunScopedLlmBudgetReservationAsync(
        RunScopedLlmBudgetAdmitResult admit,
        bool commitReservation,
        CancellationToken cancellationToken)
    {
        if (!admit.ReservationHeld || admit.ReservationId is null)
            return;

        Guid reservationId = admit.ReservationId.Value;

        if (commitReservation)
        {
            await _runScopedLlmBudgetReservationService.CommitAsync(
                reservationId,
                admit.ReservedUsd,
                cancellationToken);

            return;
        }

        await _runScopedLlmBudgetReservationService.ReleaseAsync(reservationId, cancellationToken);
    }
}
