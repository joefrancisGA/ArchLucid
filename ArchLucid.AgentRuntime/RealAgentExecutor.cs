using System.Collections.Concurrent;
using System.Diagnostics;

using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Polly;

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
    private static readonly ConcurrentDictionary<int, ResiliencePipeline<AgentResult>> TimeoutPipelines = new();

    private readonly IAgentHandlerConcurrencyGate _concurrencyGate;
    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputBudgetGate;
    private readonly IReadOnlyDictionary<string, IAgentHandler> _handlers;
    private readonly ILogger<RealAgentExecutor> _logger;
    private readonly IOptionsMonitor<AgentPromptCatalogOptions> _promptCatalog;
    private readonly IOptions<AgentExecutionResilienceOptions> _resilienceOptions;
    private readonly IOptions<StagedCriticAgentOptions> _stagedCriticOptions;
    private readonly IScopeContextProvider _scopeContextProvider;

    /// <summary>Builds a lookup of handlers keyed by <see cref="IAgentHandler.AgentTypeKey" /> (duplicates throw).</summary>
    public RealAgentExecutor(
        IEnumerable<IAgentHandler> handlers,
        ILogger<RealAgentExecutor> logger,
        IOptionsMonitor<AgentPromptCatalogOptions> promptCatalog,
        IScopeContextProvider scopeContextProvider,
        IAgentHandlerConcurrencyGate concurrencyGate,
        IOptions<AgentExecutionResilienceOptions> resilienceOptions,
        IOptions<StagedCriticAgentOptions> stagedCriticOptions,
        IOptions<AgentOutputQualityGateOptions> agentOutputBudgetGate)
    {
        ArgumentNullException.ThrowIfNull(handlers);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _promptCatalog = promptCatalog ?? throw new ArgumentNullException(nameof(promptCatalog));
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
        _concurrencyGate = concurrencyGate ?? throw new ArgumentNullException(nameof(concurrencyGate));
        _resilienceOptions = resilienceOptions ?? throw new ArgumentNullException(nameof(resilienceOptions));
        _stagedCriticOptions = stagedCriticOptions ?? throw new ArgumentNullException(nameof(stagedCriticOptions));
        _agentOutputBudgetGate = agentOutputBudgetGate ?? throw new ArgumentNullException(nameof(agentOutputBudgetGate));

        List<IAgentHandler> list = handlers.ToList();
        string[] duplicateKeys = list
            .GroupBy(h => h.AgentTypeKey, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToArray();

        if (duplicateKeys.Length > 0)

            throw new ArgumentException(
                $"Duplicate IAgentHandler registrations for keys: {string.Join(", ", duplicateKeys)}",
                nameof(handlers));

        _handlers = list.ToDictionary(h => h.AgentTypeKey, StringComparer.OrdinalIgnoreCase);
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

        if (_logger.IsEnabled(LogLevel.Information))
        {
            string types = string.Join(
                ',',
                orderedTasks.Select(AgentTypeKeys.ResolveDispatchKey));

            _logger.LogInformationAgentExecutionBatchStarting(runId, types, orderedTasks.Length);
        }

        ScopeContext batchScope = _scopeContextProvider.GetCurrentScope();

        AgentExecutionLlmCallAccumulator llmCalls = new();

        using (ArchLucidInstrumentation.BeginLlmCallsPerRunAccumulation(llmCalls))
        using (AmbientScopeContext.Push(batchScope))
        using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
        {
            try
            {
                StagedCriticAgentOptions stagedOpts = _stagedCriticOptions.Value;
                stagedOpts.Normalize();

                bool useStagedCritic = stagedOpts.StagedCriticEnabled
                    && orderedTasks.Any(static t => t.AgentType == AgentType.Critic)
                    && orderedTasks.Any(static t => t.AgentType != AgentType.Critic);

                AgentResult[] finished;

                if (useStagedCritic)
                {
                    AgentTask[] phase1 = orderedTasks.Where(static t => t.AgentType != AgentType.Critic).ToArray();
                    AgentTask[] phase2 = orderedTasks.Where(static t => t.AgentType == AgentType.Critic).ToArray();

                    AgentResult[] phase1Results = await ExecutePhaseWhenAllAsync(
                            runId,
                            request,
                            evidence,
                            phase1,
                            linked)
                        .ConfigureAwait(false);

                    ReplaceStagedPriorSummaryNotes(evidence);
                    EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote(phase1Results, stagedOpts);
                    evidence.Notes.Add(note);

                    AgentResult[] phase2Results = await ExecutePhaseWhenAllAsync(
                            runId,
                            request,
                            evidence,
                            phase2,
                            linked)
                        .ConfigureAwait(false);

                    Dictionary<string, AgentResult> byTaskId = new(StringComparer.Ordinal);

                    foreach (AgentResult r in phase1Results)
                    {
                        byTaskId[r.TaskId] = r;
                    }

                    foreach (AgentResult r in phase2Results)
                    {
                        byTaskId[r.TaskId] = r;
                    }

                    finished = orderedTasks.Select(t => byTaskId[t.TaskId]).ToArray();
                }
                else
                {
                    finished = await ExecutePhaseWhenAllAsync(
                            runId,
                            request,
                            evidence,
                            orderedTasks,
                            linked)
                        .ConfigureAwait(false);
                }

                if (_logger.IsEnabled(LogLevel.Information))

                    _logger.LogInformationAgentExecutionBatchCompleted(runId, finished.Length);

                return finished;
            }
            catch
            {
                await linked.CancelAsync();
                throw;
            }
            finally
            {
                int n = llmCalls.Consume();

                ArchLucidInstrumentation.LlmCallsPerRun.Record(n);
            }
        }
    }

    private async Task<AgentResult[]> ExecutePhaseWhenAllAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> phaseTasks,
        CancellationTokenSource linkedCancellation)
    {
        if (phaseTasks.Count == 0)
            return [];

        Task<AgentResult>[] tasks = new Task<AgentResult>[phaseTasks.Count];

        for (int i = 0; i < phaseTasks.Count; i++)
        {
            AgentTask phaseTaskItem = phaseTasks[i];
            tasks[i] =
                ExecuteSingleAsync(runId, request, evidence, phaseTaskItem, linkedCancellation.Token);
        }

        if (!_agentOutputBudgetGate.Value.PersistPartialOutputsOnBudgetExceeded)
            return await Task.WhenAll(tasks).ConfigureAwait(false);

        return await DrainParallelHandlersWithBudgetSupportAsync(tasks, phaseTasks, linkedCancellation)
            .ConfigureAwait(false);
    }

    /// <summary>
    ///     Drains concurrently running handler tasks until all complete. When run-level token/USD ceilings trip, cancels peer
    ///     tasks and either throws <see cref="AgentRunPartialBudgetException"/> (successful peers first) or
    ///     <see cref="CostLimitExceededException"/>.
    /// </summary>
    private async Task<AgentResult[]> DrainParallelHandlersWithBudgetSupportAsync(
        Task<AgentResult>[] tasks,
        IReadOnlyList<AgentTask> phaseTasks,
        CancellationTokenSource linkedCancellation)
    {
        HashSet<Task<AgentResult>> pending = new(tasks);
        CostLimitExceededException? budgetCause = null;

        while (pending.Count > 0)
        {
            Task<AgentResult> finishedTask = await Task.WhenAny(pending).ConfigureAwait(false);

            _ = pending.Remove(finishedTask);

            if (finishedTask.IsCompletedSuccessfully)
                continue;

            if (finishedTask.IsCanceled)
                continue;

            if (!finishedTask.IsFaulted)
                continue;

            Exception flattened = ExtractFailureRoot(finishedTask);

            CostLimitExceededException? candidate = ExtractCostLimitCause(flattened);

            budgetCause ??= candidate ?? throw flattened;

            if (!linkedCancellation.IsCancellationRequested)
                await linkedCancellation.CancelAsync();
        }

        AgentResult[] orderedSuccesses =
            SnapshotSuccessfulResultsPreservePhaseTaskOrder(tasks, phaseTasks.Count);

        if (budgetCause is not null && orderedSuccesses.Length > 0)
            throw new AgentRunPartialBudgetException(budgetCause, orderedSuccesses);

        if (budgetCause is not null)
            throw budgetCause;

        return orderedSuccesses.Length != phaseTasks.Count ? throw new InvalidOperationException("Parallel agent scheduling finished without aligning task outcomes.") : orderedSuccesses;
    }

    private static Exception ExtractFailureRoot(Task<AgentResult> faultedTask)
    {
        Exception ex = faultedTask.Exception ?? throw new InvalidOperationException("Expected faulted task exception.");

        if (ex is not AggregateException aggregate)
            return ex;

        AggregateException flattened = aggregate.Flatten();

        return flattened.InnerExceptions.Count == 1 ? flattened.InnerExceptions[0] : throw flattened;
    }

    private static CostLimitExceededException? ExtractCostLimitCause(Exception ex)
    {
        for (Exception? walker = ex; walker is not null; walker = walker.InnerException)
        {
            if (walker is CostLimitExceededException matched)
                return matched;
        }

        return ex is not AggregateException ae ? null : ae.Flatten().InnerExceptions.Select(ExtractCostLimitCause).OfType<CostLimitExceededException>().FirstOrDefault();
    }

    /// <summary>Collects successes in ascending <paramref name="phaseTasks" /> order for stable parity with callers.</summary>
    private static AgentResult[] SnapshotSuccessfulResultsPreservePhaseTaskOrder(Task<AgentResult>[] tasks, int phaseLen)
    {
        List<AgentResult> successes = [];

        for (int i = 0; i < phaseLen; i++)
        {
            Task<AgentResult> task = tasks[i];

            if (task.Status != TaskStatus.RanToCompletion)
                continue;

            successes.Add(task.Result);
        }

        return successes.Count == 0 ? [] : successes.ToArray();
    }

    private static void ReplaceStagedPriorSummaryNotes(AgentEvidencePackage evidence)
    {
        ArgumentNullException.ThrowIfNull(evidence);

        evidence.Notes.RemoveAll(static n =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(n.NoteType, StringComparison.Ordinal));
    }

    private async Task<AgentResult> ExecuteSingleAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CancellationToken cancellationToken)
    {
        using (AgentHandlerLlmReasoningTrace.BeginHandlerScope())
        {
            string dispatchKey = AgentTypeKeys.ResolveDispatchKey(task);

            if (!_handlers.TryGetValue(dispatchKey, out IAgentHandler? handler))

                throw new InvalidOperationException(
                    $"No handler is registered for agent type key '{dispatchKey}'.");

            int timeoutSeconds = _resilienceOptions.Value.ResolveTimeoutSecondsForAgent(dispatchKey);
            ResiliencePipeline<AgentResult> handlerTimeoutPipeline = ResolveTimeoutPipeline(timeoutSeconds);

            Stopwatch sw = Stopwatch.StartNew();

            AgentResult result;

            using (Activity? activity = ArchLucidInstrumentation.AgentHandler.StartActivity(
                       "archlucid.agent.handle"))
            {
                activity?.SetTag("archlucid.run_id", runId);
                activity?.SetTag("archlucid.task_id", task.TaskId);
                activity?.SetTag("archlucid.agent.type", dispatchKey);
                activity?.SetTag("archlucid.agent.type_enum", task.AgentType.ToString());

                string promptVersion = ResolvePromptVersion(dispatchKey);
                activity?.SetTag("archlucid.agent.prompt_version", promptVersion);

                try
                {
                    result = await _concurrencyGate.ExecuteAsync(
                        async ct =>
                            await handlerTimeoutPipeline.ExecuteAsync(
                                async (_, innerCt) => await handler.ExecuteAsync(
                                    runId,
                                    request,
                                    evidence,
                                    task,
                                    innerCt),
                                ct, ct),
                        cancellationToken);

                    ArchLucidInstrumentation.AgentHandlerInvocationsTotal.Add(
                        1,
                        new KeyValuePair<string, object?>("agent_type_key", dispatchKey),
                        new KeyValuePair<string, object?>("outcome", "success"));
                }
                catch (Exception ex)
                {
                    activity?.SetStatus(ActivityStatusCode.Error, "Agent handler failed.");
                    activity?.AddException(ex);

                    ArchLucidInstrumentation.AgentHandlerInvocationsTotal.Add(
                        1,
                        new KeyValuePair<string, object?>("agent_type_key", dispatchKey),
                        new KeyValuePair<string, object?>("outcome", "error"));

                    throw new AgentHandlerExecutionException(dispatchKey, task.AgentType, ex);
                }

                activity?.SetTag("archlucid.agent.confidence", result.Confidence);
                activity?.SetTag("archlucid.agent.findings_count", result.Findings.Count);
                activity?.SetTag("archlucid.agent.claims_count", result.Claims.Count);
            }

            sw.Stop();

            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebugAgentTaskFinished(runId, task.TaskId, dispatchKey, sw.ElapsedMilliseconds);

            string? providerTrace = AgentHandlerLlmReasoningTrace.TryConsumeBuffered();

            return MergeProviderReasoningTrace(result, providerTrace);
        }
    }

    private static AgentResult MergeProviderReasoningTrace(AgentResult result, string? providerTrace)
    {
        if (string.IsNullOrWhiteSpace(providerTrace))
            return result;

        string trimmed = providerTrace.Trim();

        if (string.IsNullOrWhiteSpace(result.ReasoningTrace))
        {
            result.ReasoningTrace = trimmed;

            return result;
        }

        result.ReasoningTrace = result.ReasoningTrace.TrimEnd() + "\n\n---\n\n" + trimmed;

        return result;
    }

    private static ResiliencePipeline<AgentResult> ResolveTimeoutPipeline(int timeoutSeconds)
    {
        if (timeoutSeconds <= 0)
            return ResiliencePipeline<AgentResult>.Empty;

        return TimeoutPipelines.GetOrAdd(
            timeoutSeconds,
            secs => new ResiliencePipelineBuilder<AgentResult>()
                .AddTimeout(TimeSpan.FromSeconds(secs))
                .Build());
    }

    private string ResolvePromptVersion(string agentTypeKey)
    {
        AgentPromptCatalogOptions current = _promptCatalog.CurrentValue;

        if (current.Versions.TryGetValue(agentTypeKey, out string? v) && !string.IsNullOrWhiteSpace(v))
            return v.Trim();

        return "default";
    }
}
