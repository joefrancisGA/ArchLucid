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

/// <summary>Quality-gate auto-retry and reject marking for execute orchestration.</summary>
public sealed partial class ArchitectureRunExecuteOrchestrator
{

    private async Task<IReadOnlyList<AgentResult>> RunQualityGateTraceEvaluationLoopAsync(
        string runId,
        string actor,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> initialResults,
        CancellationToken cancellationToken)
    {
        List<AgentResult> mutableResults = initialResults.ToList();
        IReadOnlyList<AgentResult> results = initialResults;
        int qualityGateAutoRetryAttempt = 0;
        int maxAutoRetries = Math.Max(0, _agentOutputQualityGateOptions.Value.MaxAutoRetries);

        while (true)
        {
            try
            {
                await outputTraceEvaluationHook.AfterSuccessfulExecuteAsync(runId, cancellationToken);
                results = mutableResults;
                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true }
                      && qualityGateAutoRetryAttempt < maxAutoRetries)
            {
                qualityGateAutoRetryAttempt++;

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation(
                        "Quality gate rejected trace; auto-retrying agent {AgentLabel} for RunId={RunId} attempt {Attempt}/{MaxAttempts} TraceId={TraceId}",
                        ex.AgentLabel,
                        LogSanitizer.Sanitize(runId),
                        qualityGateAutoRetryAttempt,
                        maxAutoRetries,
                        LogSanitizer.Sanitize(ex.TraceId));
                }

                mutableResults = await RetryQualityGateRejectedAgentAsync(
                    runId,
                    request,
                    evidence,
                    tasks,
                    mutableResults,
                    ex,
                    cancellationToken);
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true })
            {
                await TryMarkRunQualityGateRejectedAsync(runId, actor, ex, cancellationToken);
                throw;
            }
            catch (Exception ex)
            {
                if (logger.IsEnabled(LogLevel.Warning))
                    logger.LogWarning(ex, "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged.",
                        LogSanitizer.Sanitize(runId));

                logger.LogError(ex, "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged. CorrelationId={CorrelationId}", LogSanitizer.Sanitize(runId), System.Diagnostics.Activity.Current?.Id ?? "unknown");
                results = mutableResults;
                break;
            }
        }

        return results;
    }


    private async Task<List<AgentResult>> RetryQualityGateRejectedAgentAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> currentResults,
        AgentOutputQualityGateRejectedException rejection,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(rejection);

        if (!Enum.TryParse(rejection.AgentLabel, ignoreCase: true, out AgentType agentType))
        {
            throw new InvalidOperationException(
                $"Cannot auto-retry quality gate rejection: unknown agent label '{rejection.AgentLabel}'.");
        }

        AgentTask? task = tasks.FirstOrDefault(t => t.AgentType == agentType);

        if (task is null)
        {
            throw new InvalidOperationException(
                $"Cannot auto-retry quality gate rejection: no task for agent '{rejection.AgentLabel}' on run '{runId}'.");
        }

        AgentTask retryTask = BuildQualityGateRetryTask(task, agentType);

        IReadOnlyList<AgentResult> retryBatch;

        using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.ArchitectureGeneration))
        {
            retryBatch =
                await _agentExecutor.ExecuteAsync(runId, request, evidence, [retryTask], cancellationToken);
        }

        if (retryBatch.Count == 0)
        {
            throw new InvalidOperationException(
                $"Quality gate auto-retry produced no result for agent '{rejection.AgentLabel}' on run '{runId}'.");
        }

        AgentResult replacement = retryBatch[0];

        await _agentResultPostExecutionEnricher
            .EnrichAsync(runId, request, evidence, retryBatch, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await TryLoadRunHeaderForStampingAsync(runId, scope, cancellationToken);
        StampTaskExecutionModesOnResults([replacement], header);

        await _resultRepository.ReplaceForRunTaskAsync(replacement, cancellationToken);

        List<AgentResult> updated = currentResults.ToList();
        int index = updated.FindIndex(r => string.Equals(r.TaskId, task.TaskId, StringComparison.Ordinal));

        if (index >= 0)
            updated[index] = replacement;
        else
            updated.Add(replacement);

        return updated;
    }


    private AgentTask BuildQualityGateRetryTask(AgentTask task, AgentType agentType)
    {
        if (!_agentOutputQualityGateOptions.Value.EscalateTierOnRetry)
            return task;

        LlmModelTier currentTier = task.ModelTierOverride ?? AgentModelTierRetryDefaults.DefaultTierForAgent(agentType);

        if (!AgentModelTierEscalation.CanEscalate(currentTier))
            return task;

        LlmModelTier escalatedTier = AgentModelTierEscalation.Escalate(currentTier);

        return new AgentTask
        {
            TaskId = task.TaskId,
            RunId = task.RunId,
            AgentType = task.AgentType,
            AgentTypeKey = task.AgentTypeKey,
            Objective = task.Objective,
            Status = task.Status,
            CreatedUtc = task.CreatedUtc,
            CompletedUtc = task.CompletedUtc,
            EvidenceBundleRef = task.EvidenceBundleRef,
            AllowedTools = task.AllowedTools,
            AllowedSources = task.AllowedSources,
            ModelTierOverride = escalatedTier,
        };
    }


    private async Task TryMarkRunQualityGateRejectedAsync(
        string runId,
        string actor,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Quality gate reject: dbo.Runs header missing for RunId={RunId}.", LogSanitizer.Sanitize(runId));

            return;
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected);
        await runRepository.UpdateAsync(header, cancellationToken);

        string details = $"TraceId={ex.TraceId};AgentLabel={ex.AgentLabel}";
        await baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Architecture.RunQualityGateRejected,
            actor,
            runId,
            details,
            cancellationToken);
    }
}
