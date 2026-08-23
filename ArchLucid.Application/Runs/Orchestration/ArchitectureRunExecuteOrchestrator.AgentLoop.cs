using System.Text.Json;

using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Agent batch execution, budget reservation, post-batch enrichment, and completion promotion.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{

    private async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest request = await requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        RequestContentSafetyResult safety = await requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);

        if (!safety.IsAllowed)
            throw new RequestContentSafetyRejectedException(safety.Reasons);

        using (PilotModeGovernanceScope.BeginFromPolicyReferences(request.PolicyReferences, request.CloudProvider))
        {
            ScopeContext executeScope = _scopeContextProvider.GetCurrentScope();
            IReadOnlyList<AgentTask> tasks = await taskRepository.GetByRunIdAsync(executeScope, runId, cancellationToken);

            if (tasks.Count == 0)
                throw new InvalidOperationException($"No tasks found for run '{runId}'.");
            AgentEvidencePackage evidence = await evidenceBuilder.BuildAsync(runId, request, cancellationToken);

            await _evidencePackageInjectionMitigator.RedactKnownInjectionPatternsAsync(evidence, cancellationToken);

            await _agentEvidenceUntrustedInputSanitizer.SanitizeAsync(evidence, cancellationToken);

            string scheduledTaskIds = AgentExecutionStateTransitionTaskIds.Format(tasks.ToList());

            if (TryParseRunGuid(runId, out Guid executeTransitionRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    executeTransitionRunId,
                    "execute_enter",
                    "agent_batch_executing",
                    scheduledTaskIds);

            Guid tenantId = executeScope.TenantId;
            RunScopedLlmBudgetAdmitResult budgetAdmit =
                await AdmitRunScopedLlmBudgetOrThrowAsync(tenantId, runId, tasks.Count, cancellationToken);

            IReadOnlyList<AgentResult> results;

            try
            {
                await ThrowIfCooperativeCancelRequestedAsync(runId, cancellationToken);

                try
                {
                    using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
                    {
                        results = await agentExecutor.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
                    }
                }
                catch (AgentRunPartialBudgetException partial)
                    when (_agentOutputQualityGateOptions.Value.PersistPartialOutputsOnBudgetExceeded &&
                          partial.CompletedResults.Count > 0)
                {
                    IReadOnlyList<AgentEvaluation> partialEvaluations =
                        await agentEvaluationService.EvaluateAsync(
                            runId,
                            request,
                            evidence,
                            tasks,
                            partial.CompletedResults,
                            cancellationToken);

                    await PersistPartialExecutePhaseAsync(evidence, partial.CompletedResults, partialEvaluations, cancellationToken);

                    AgentExecutionFailureSummary partialFailure =
                        AgentExecutionFailureSummaryFactory.FromException(partial.BudgetCause);

                    await TryMarkRunExecuteFailedAsync(runId, partialFailure, partial.CompletedResults, cancellationToken);

                    await baselineMutationAudit.RecordAsync(
                        AuditEventTypes.Baseline.Architecture.RunFailed,
                        actor,
                        runId,
                        FormatExecuteRunFailureAuditDetails(partialFailure),
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

            if (TryParseRunGuid(runId, out Guid afterBatchRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    afterBatchRunId,
                    "agent_batch_executing",
                    "agent_results_persisting",
                    scheduledTaskIds);

            await _agentResultPostExecutionEnricher
                .EnrichAsync(runId, request, evidence, results, cancellationToken)
                .ConfigureAwait(false);

            await TrySeedTechnologyLedgerFromTopologyAsync(runId, request, results, cancellationToken);

            IReadOnlyList<AgentEvaluation> evaluations =
                await agentEvaluationService.EvaluateAsync(runId, request, evidence, tasks, results, cancellationToken);
            await PersistExecutePhaseAsync(evidence, results, evaluations, cancellationToken);

            if (TryParseRunGuid(runId, out Guid afterPersistRunId))
                logger.LogInformationAgentExecutionStateTransition(
                    afterPersistRunId,
                    "agent_results_persisting",
                    "execute_complete",
                    scheduledTaskIds);

            results = await RunQualityGateTraceEvaluationLoopAsync(
                runId,
                actor,
                request,
                evidence,
                tasks,
                results,
                cancellationToken);

            await TryPersistEngineProvenanceAsync(runId, evidence, cancellationToken);
            await TryPersistGovernanceScopeAsync(runId, request, cancellationToken);
            await TryApplyExecuteCompletionLegacyStatusAsync(runId, results, cancellationToken);
            await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunExecuteSucceeded, actor, runId, $"ResultCount={results.Count}",
                cancellationToken);

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Architecture run execution completed: RunId={RunId}, ResultCount={ResultCount}", LogSanitizer.Sanitize(runId),
                    results.Count);

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
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
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
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Governance scope capture failed for RunId={RunId}; execute outcome unchanged.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }


    /// <summary>
    ///     ADR-0012: execute no longer wrote <c>LegacyRunStatus</c>; clients and UIs still expect
    ///     <see cref = "ArchitectureRunStatus.ReadyForCommit"/>
    ///     once all required agent outputs exist (matches commit prerequisites and orchestrator contract).
    /// </summary>
    private async Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Execute: cannot update run {RunId} status — dbo.Runs header missing.", LogSanitizer.Sanitize(runId));
            return;
        }

        string previousLegacyRunStatus = header.LegacyRunStatus ?? "";

        if (string.Equals(previousLegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        if (OperationRunCancellationMarker.IsAlreadyCanceled(header))
            return;

        if (_operationCancellationRegistry.IsCancelRequested(scope, OperationIdCodec.ForRun(runGuid)))
            return;

        ArchitectureRunStatus derived = _runStateTransitionService.DeriveStatusAfterExecuteCompletion(results);

        if (derived is ArchitectureRunStatus.ReadyForCommit
            && !_runStateTransitionService.ShouldPromoteLegacyStatusToReadyForCommit(previousLegacyRunStatus))
            return;

        header.LegacyRunStatus = derived.ToString();

        // TB-310: request-time authority pipeline may have sealed anchors; StructuralExecutionMode is immutable then.
        if (header.GoldenManifestId is null)
        {
            IReadOnlyList<AgentResult> persistedResults =
                await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

            StructuralExecutionMode? rollup =
                RunStructuralExecutionModeRollup.TryResolveFromStampedResults(persistedResults);

            if (rollup is not null)
            {
                header.StructuralExecutionMode = rollup.Value;
            }
            else if (derived is ArchitectureRunStatus.ReadyForCommit)
            {
                header.StructuralExecutionMode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
                    _agentExecutionOptions.Value,
                    header.RealModeFellBackToSimulator);
            }
        }

        await runRepository.UpdateAsync(header, cancellationToken);

        if (derived is not ArchitectureRunStatus.ReadyForCommit)
            return;

        string actor = actorContext.GetActor();
        AuditEvent legacyReadyForCommitPromoted = new()
        {
            EventType = AuditEventTypes.RunLegacyReadyForCommitPromoted,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            DataJson = JsonSerializer.Serialize(new
            {
                runId,
                previousLegacyRunStatus,
                newLegacyRunStatus = header.LegacyRunStatus
            },
                AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.TryLogAsync(
            ct => auditService.LogAsync(legacyReadyForCommitPromoted, ct),
            logger,
            $"{AuditEventTypes.RunLegacyReadyForCommitPromoted}:{LogSanitizer.Sanitize(runId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RunLegacyReadyForCommitPromoted);
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
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
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
