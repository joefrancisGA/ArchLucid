using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteQualityGateRetryStage" />
public sealed class ArchitectureRunExecuteQualityGateRetryStage(
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IAgentExecutor agentExecutor,
    IAgentResultPostExecutionEnricher agentResultPostExecutionEnricher,
    IAgentResultRepository resultRepository,
    IScopeContextProvider scopeContextProvider,
    IArchitectureRunExecutePersistRowsStage persistRowsStage) : IArchitectureRunExecuteQualityGateRetryStage
{
    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly IAgentExecutor _agentExecutor =
        agentExecutor ?? throw new ArgumentNullException(nameof(agentExecutor));

    private readonly IAgentResultPostExecutionEnricher _agentResultPostExecutionEnricher =
        agentResultPostExecutionEnricher ?? throw new ArgumentNullException(nameof(agentResultPostExecutionEnricher));

    private readonly IAgentResultRepository _resultRepository =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchitectureRunExecutePersistRowsStage _persistRowsStage =
        persistRowsStage ?? throw new ArgumentNullException(nameof(persistRowsStage));

    /// <inheritdoc />
    public async Task<List<AgentResult>> RetryQualityGateRejectedAgentAsync(
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
        RunRecord? header = await _persistRowsStage.TryLoadRunHeaderForStampingAsync(runId, scope, cancellationToken);
        _persistRowsStage.StampTaskExecutionModesOnResults([replacement], header);

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
