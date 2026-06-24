using System.Globalization;
using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     LLM faithfulness judge: compares <c>ParsedResultJson</c> claims/findings against flattened evidence text.
/// </summary>
public sealed class AgentOutputFaithfulnessEvaluator(
    IServiceScopeFactory scopeFactory,
    IScopeContextProvider scopeContextProvider,
    IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> faithfulnessOptions,
    IOptionsMonitor<AgentOutputQualityGateOptions> qualityGateOptions,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
    ILogger<AgentOutputFaithfulnessEvaluator> logger) : IAgentOutputFaithfulnessEvaluator
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> _faithfulnessOptions =
        faithfulnessOptions ?? throw new ArgumentNullException(nameof(faithfulnessOptions));

    private readonly IOptionsMonitor<AgentOutputQualityGateOptions> _qualityGateOptions =
        qualityGateOptions ?? throw new ArgumentNullException(nameof(qualityGateOptions));

    private readonly IOptionsMonitor<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly ILogger<AgentOutputFaithfulnessEvaluator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<double?> TryEvaluateAsync(
        string traceId,
        string parsedResultJson,
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(parsedResultJson);
        ArgumentNullException.ThrowIfNull(evidencePackage);

        AgentOutputQualityGateOptions gateOpts = _qualityGateOptions.CurrentValue;

        if (!gateOpts.Enabled)
            return null;

        AgentOutputLlmFaithfulnessOptions opts = _faithfulnessOptions.CurrentValue;

        if (!opts.Enabled)
            return null;

        AgentExecutionOptions exec = _agentExecutionOptions.CurrentValue;

        if (opts.SkipWhenSimulator
            && string.Equals(exec.Mode.Trim(), "Simulator", StringComparison.OrdinalIgnoreCase))
            return null;

        AgentEvidenceGroundingIndex.Index index = AgentEvidenceGroundingIndex.Build(evidencePackage);

        if (string.IsNullOrWhiteSpace(index.FullBlob))
            return null;

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

        ILlmJudgeBudgetTracker judgeBudgetTracker =
            scope.ServiceProvider.GetRequiredService<ILlmJudgeBudgetTracker>();

        if (!await judgeBudgetTracker.TryPeekWithinBudgetAsync(tenantId, cancellationToken).ConfigureAwait(false))
        {
            judgeBudgetTracker.RecordBudgetExhausted();

            return null;
        }

        IAgentCompletionClient client;

        try
        {
            client = scope.ServiceProvider.GetRequiredKeyedService<IAgentCompletionClient>(
                AgentOutputLlmJudgeCompletionServiceKey.Value);
        }
        catch (InvalidOperationException ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    ex,
                    "LLM faithfulness judge completion client is unavailable for TraceId={TraceId}",
                    traceId);

            return null;
        }

        string evidenceText = TrimForJudge(index.FullBlob, opts.MaxEvidenceCharacters);
        string agentJson = TrimForJudge(parsedResultJson, opts.MaxInputCharacters);

        ResolvedSystemPrompt systemResolved = FaithfulnessJudgePromptResolver.Resolve();
        AgentPromptActivityTags.Apply(systemResolved);

        string systemPrompt = systemResolved.Text;
        string userPrompt = FaithfulnessJudgeUserPromptBuilder.Build(traceId, evidenceText, agentJson);

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "LLM faithfulness judge prompt TemplateId={TemplateId} Version={TemplateVersion} TraceId={TraceId}",
                systemResolved.TemplateId,
                systemResolved.TemplateVersion,
                traceId);
        }

        using CancellationTokenSource linked =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        linked.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, opts.TimeoutSeconds)));

        try
        {
            string raw = await client.CompleteJsonAsync(
                    systemPrompt,
                    userPrompt,
                    maxTokens: null,
                    cancellationToken: linked.Token)
                .ConfigureAwait(false);

            return TryParseFaithfulnessResponse(raw);
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM faithfulness judge timed out for TraceId={TraceId}", traceId);

            return null;
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM faithfulness judge failed for TraceId={TraceId}", traceId);

            return null;
        }
    }

    private static string TrimForJudge(string text, int maxChars)
    {
        maxChars = Math.Max(4096, maxChars);

        if (text.Length <= maxChars)
            return text;

        return text.Substring(0, maxChars) +
               "\n…truncated_total_chars=" +
               text.Length.ToString(CultureInfo.InvariantCulture);
    }

    private static double? TryParseFaithfulnessResponse(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(raw.Trim());
            JsonElement root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            double score = ReadScore(root);

            if (double.IsNaN(score) || double.IsInfinity(score))
                return null;

            return Math.Clamp(score, 0.0, 1.0);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static double ReadScore(JsonElement root)
    {
        if (root.TryGetProperty("faithfulnessScore", out JsonElement camel) && TryGetDouble(camel, out double v1))
            return v1;

        if (root.TryGetProperty("faithfulness_score", out JsonElement snake) && TryGetDouble(snake, out double v2))
            return v2;

        return double.NaN;
    }

    private static bool TryGetDouble(JsonElement element, out double value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetDouble(out value))
            return true;

        if (element.ValueKind == JsonValueKind.String
            && double.TryParse(element.GetString(), CultureInfo.InvariantCulture, out value))
            return true;

        value = double.NaN;

        return false;
    }
}
