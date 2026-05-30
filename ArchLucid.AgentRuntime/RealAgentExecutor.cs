using System.Diagnostics;

using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Production <see cref="IAgentExecutor" />: resolves <see cref="IAgentHandler" /> by
///     <see cref="AgentTypeKeys.ResolveDispatchKey" />,
///     runs independent tasks concurrently, and returns <see cref="AgentResult" /> rows in stable dispatch-key order.
/// </summary>
/// <remarks>
///     Handlers share the same <see cref="AgentEvidencePackage" /> and normally do not consume each other&apos;s outputs in
///     prompts. When <c>ArchLucid:Agents:StagedCriticEnabled</c> is true and the batch includes Critic plus other agents,
///     non-Critic tasks run first, then a bounded summary of their <see cref="AgentResult" /> payloads is appended to
///     evidence notes before Critic runs (Real executor path only; not autonomous planning beyond product scope).
///     <see cref="AmbientScopeContext" /> is pushed for the batch so scoped services (e.g. LLM accounting) resolve tenant
///     scope on thread-pool continuations.
///     On any failure, linked cancellation is signaled so in-flight completions can abort promptly.
/// </remarks>
public sealed class RealAgentExecutor : IAgentExecutor
{
    private readonly RealAgentExecutorExecutionDependencies _dependencies;

    /// <summary>Builds a lookup of handlers keyed by <see cref="IAgentHandler.AgentTypeKey" /> (duplicates throw).</summary>
    public RealAgentExecutor(
        IEnumerable<IAgentHandler> handlers,
        ILogger<RealAgentExecutor> logger,
        IOptionsMonitor<AgentPromptCatalogOptions> promptCatalog,
        IScopeContextProvider scopeContextProvider,
        IAgentHandlerConcurrencyGate concurrencyGate,
        IOptions<AgentExecutionResilienceOptions> resilienceOptions,
        IOptions<StagedCriticAgentOptions> stagedCriticOptions,
        IOptions<AgentOutputQualityGateOptions> agentOutputBudgetGate,
        IPromptRedactor promptRedactor,
        IOptionsMonitor<ArchLucidLlmOptions> archLucidLlmOptions,
        IAgentResultRepository agentResultRepository)
    {
        ArgumentNullException.ThrowIfNull(handlers);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(promptCatalog);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(concurrencyGate);
        ArgumentNullException.ThrowIfNull(resilienceOptions);
        ArgumentNullException.ThrowIfNull(stagedCriticOptions);
        ArgumentNullException.ThrowIfNull(agentOutputBudgetGate);
        ArgumentNullException.ThrowIfNull(promptRedactor);
        ArgumentNullException.ThrowIfNull(archLucidLlmOptions);
        ArgumentNullException.ThrowIfNull(agentResultRepository);

        List<IAgentHandler> list = handlers.ToList();
        string[] duplicateKeys = list
            .GroupBy(static handler => handler.AgentTypeKey, StringComparer.OrdinalIgnoreCase)
            .Where(static group => group.Count() > 1)
            .Select(static group => group.Key)
            .ToArray();

        if (duplicateKeys.Length > 0)
        {
            throw new ArgumentException(
                $"Duplicate IAgentHandler registrations for keys: {string.Join(", ", duplicateKeys)}",
                nameof(handlers));
        }

        IReadOnlyDictionary<string, IAgentHandler> handlerLookup =
            list.ToDictionary(static handler => handler.AgentTypeKey, StringComparer.OrdinalIgnoreCase);

        _dependencies = new RealAgentExecutorExecutionDependencies(
            handlerLookup,
            logger,
            promptCatalog,
            scopeContextProvider,
            concurrencyGate,
            resilienceOptions,
            stagedCriticOptions,
            agentOutputBudgetGate,
            promptRedactor,
            archLucidLlmOptions,
            agentResultRepository);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(tasks);

        AgentTask[] orderedTasks = tasks
            .OrderBy(AgentTypeKeys.ResolveDispatchKey, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (orderedTasks.Length == 0)
            return [];

        if (_dependencies.Logger.IsEnabled(LogLevel.Information))
        {
            string types = string.Join(
                ',',
                orderedTasks.Select(AgentTypeKeys.ResolveDispatchKey));

            _dependencies.Logger.LogInformationAgentExecutionBatchStarting(runId, types, orderedTasks.Length);
        }

        ScopeContext batchScope = _dependencies.ScopeContextProvider.GetCurrentScope();

        IReadOnlyList<AgentResult> persistedResults =
            await _dependencies.AgentResultRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        Dictionary<string, AgentResult> persistedByTaskId = persistedResults
            .GroupBy(static result => result.TaskId, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.Last(), StringComparer.Ordinal);

        AgentExecutionLlmCallAccumulator llmCalls = new();

        using (ArchLucidInstrumentation.BeginLlmCallsPerRunAccumulation(llmCalls))
        using (AmbientScopeContext.Push(batchScope))
        using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
        {
            try
            {
                StagedCriticAgentOptions stagedOptions = _dependencies.StagedCriticOptions.Value;
                stagedOptions.Normalize();

                AgentResult[] finished;

                if (RealAgentExecutorStagedCriticExecution.ShouldUseStagedCritic(stagedOptions, orderedTasks))
                {
                    finished = await RealAgentExecutorStagedCriticExecution.ExecuteAsync(
                            _dependencies,
                            runId,
                            request,
                            evidence,
                            orderedTasks,
                            persistedByTaskId,
                            linked)
                        .ConfigureAwait(false);
                }
                else
                {
                    finished = await RealAgentExecutorParallelPhaseExecution.ExecutePhaseWhenAllAsync(
                            _dependencies,
                            runId,
                            request,
                            evidence,
                            orderedTasks,
                            persistedByTaskId,
                            linked)
                        .ConfigureAwait(false);
                }

                if (_dependencies.Logger.IsEnabled(LogLevel.Information))
                    _dependencies.Logger.LogInformationAgentExecutionBatchCompleted(runId, finished.Length);

                return finished;
            }
            catch (OperationCanceledException)
            {
                await linked.CancelAsync();
                throw;
            }
            catch (Exception ex)
            {
                await linked.CancelAsync();

                if (ex is AgentExecutionFailedException or AgentRunPartialBudgetException or CostLimitExceededException)
                    throw;

                throw new AgentExecutionFailedException(runId, taskId: null, ex);
            }
            finally
            {
                int callCount = llmCalls.Consume();

                ArchLucidInstrumentation.LlmCallsPerRun.Record(callCount);
            }
        }
    }
}
