using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteQualityGateStage" />
public sealed class ArchitectureRunExecuteQualityGateStage(
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IAgentOutputTraceEvaluationHook outputTraceEvaluationHook,
    IAgentExecutor agentExecutor,
    IAgentResultPostExecutionEnricher agentResultPostExecutionEnricher,
    IAgentResultRepository resultRepository,
    IScopeContextProvider scopeContextProvider,
    ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
    IArchitectureRunExecutePersistenceStage persistenceStage,
    ILogger<ArchitectureRunExecuteQualityGateStage> logger) : IArchitectureRunExecuteQualityGateStage
{
    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly IAgentOutputTraceEvaluationHook _outputTraceEvaluationHook =
        outputTraceEvaluationHook ?? throw new ArgumentNullException(nameof(outputTraceEvaluationHook));

    private readonly IAgentExecutor _agentExecutor =
        agentExecutor ?? throw new ArgumentNullException(nameof(agentExecutor));

    private readonly IAgentResultPostExecutionEnricher _agentResultPostExecutionEnricher =
        agentResultPostExecutionEnricher ?? throw new ArgumentNullException(nameof(agentResultPostExecutionEnricher));

    private readonly IAgentResultRepository _resultRepository =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly IArchitectureRunExecutePersistenceStage _persistenceStage =
        persistenceStage ?? throw new ArgumentNullException(nameof(persistenceStage));

    private readonly ILogger<ArchitectureRunExecuteQualityGateStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> RunQualityGateTraceEvaluationLoopAsync(
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
                await _outputTraceEvaluationHook.AfterSuccessfulExecuteAsync(runId, cancellationToken);
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

                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation(
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
                await _postExecuteHooks.RecordQualityGateRejectedAsync(runId, actor, ex, cancellationToken);
                throw;
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged.",
                        LogSanitizer.Sanitize(runId));
                }

                _logger.LogError(
                    ex,
                    "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged. CorrelationId={CorrelationId}",
                    LogSanitizer.Sanitize(runId),
                    System.Diagnostics.Activity.Current?.Id ?? "unknown");
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

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _persistenceStage.TryLoadRunHeaderForStampingAsync(runId, scope, cancellationToken);
        _persistenceStage.StampTaskExecutionModesOnResults([replacement], header);

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
}
