using System.Collections.Concurrent;
using System.Diagnostics;

using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
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
        IOptions<StagedCriticAgentOptions> stagedCriticOptions)
    {
        ArgumentNullException.ThrowIfNull(handlers);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _promptCatalog = promptCatalog ?? throw new ArgumentNullException(nameof(promptCatalog));
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
        _concurrencyGate = concurrencyGate ?? throw new ArgumentNullException(nameof(concurrencyGate));
        _resilienceOptions = resilienceOptions ?? throw new ArgumentNullException(nameof(resilienceOptions));
        _stagedCriticOptions = stagedCriticOptions ?? throw new ArgumentNullException(nameof(stagedCriticOptions));

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
                            linked.Token)
                        .ConfigureAwait(false);

                    ReplaceStagedPriorSummaryNotes(evidence);
                    EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote(phase1Results, stagedOpts);
                    evidence.Notes.Add(note);

                    AgentResult[] phase2Results = await ExecutePhaseWhenAllAsync(
                            runId,
                            request,
                            evidence,
                            phase2,
                            linked.Token)
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
                            linked.Token)
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
        CancellationToken cancellationToken)
    {
        Task<AgentResult>[] work = phaseTasks
            .Select(task => ExecuteSingleAsync(runId, request, evidence, task, cancellationToken))
            .ToArray();

        return await Task.WhenAll(work).ConfigureAwait(false);
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
