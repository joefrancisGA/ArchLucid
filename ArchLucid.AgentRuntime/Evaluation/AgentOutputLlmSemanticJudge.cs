using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Rubric-based semantic judge using the same accounted LLM completion pipeline as agents (opt-in; Topology + Critic only).</summary>
public sealed partial class AgentOutputLlmSemanticJudge(
    IServiceScopeFactory scopeFactory,
    IScopeContextProvider scopeContextProvider,
    IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> judgeOptions,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
    ILogger<AgentOutputLlmSemanticJudge> logger) : IAgentOutputLlmSemanticJudge
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> _judgeOptions =
        judgeOptions ?? throw new ArgumentNullException(nameof(judgeOptions));

    private readonly IOptionsMonitor<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly ILogger<AgentOutputLlmSemanticJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     Null when disabled, Cost/Compliance agent, Simulator mode (optional),
    ///     keyed <see cref="IAgentCompletionClient" /> is not registered, or the completion fails. When enabled, completions
    ///     run through <see cref="LlmCompletionAccountingClient" /> with the isolated judge UTC-day token pool (not the run-execution
    ///     daily cap); monthly dollar and sliding-window quotas still apply.
    /// </summary>
    public async Task<AgentOutputLlmJudgeParsedResult?> TryJudgeAsync(
        string traceId,
        string parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(parsedResultJson);

        AgentOutputLlmSemanticJudgeOptions judgeOpts = _judgeOptions.CurrentValue;

        if (!await PassesEligibilityGatesAsync(judgeOpts, agentType, cancellationToken).ConfigureAwait(false))
            return null;

        int sampleCount = Math.Clamp(judgeOpts.JudgeInvocationCount, 1, 8);

        if (sampleCount == 1)

            return await TryInvokeJudgeSampleAsync(
                    judgeOpts,
                    traceId,
                    parsedResultJson,
                    agentType,
                    cancellationToken)
                .ConfigureAwait(false);

        Task<AgentOutputLlmJudgeParsedResult?>[] tasks = new Task<AgentOutputLlmJudgeParsedResult?>[sampleCount];

        for (int i = 0; i < sampleCount; i++)

            tasks[i] =
                TryInvokeJudgeSampleAsync(judgeOpts, traceId, parsedResultJson, agentType, cancellationToken);

        AgentOutputLlmJudgeParsedResult?[] samples = await Task.WhenAll(tasks).ConfigureAwait(false);

        List<double> qualities = [];
        string? firstRationale = null;

        foreach (AgentOutputLlmJudgeParsedResult? sample in samples)
        {
            if (sample is null)
                continue;

            qualities.Add(sample.OverallQuality);
            firstRationale ??= sample.Rationale;
        }

        if (qualities.Count == 0)
            return null;

        double median = MedianOfDoubles(qualities);

        double dispersion = PopulationStdDev(qualities);

        return new AgentOutputLlmJudgeParsedResult(median, firstRationale, dispersion, qualities.Count);
    }
}
