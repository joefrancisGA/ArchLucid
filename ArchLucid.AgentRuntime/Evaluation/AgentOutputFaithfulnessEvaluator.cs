using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     LLM faithfulness judge: compares <c>ParsedResultJson</c> claims/findings against flattened evidence text.
/// </summary>
public sealed class AgentOutputFaithfulnessEvaluator(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<AgentOutputLlmFaithfulnessOptions> faithfulnessOptions,
    IOptionsMonitor<AgentOutputQualityGateOptions> qualityGateOptions,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
    ILogger<AgentOutputFaithfulnessEvaluator> logger) : IAgentOutputFaithfulnessEvaluator
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

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

        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

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

        string systemPrompt =
            "You are a strict faithfulness rater for enterprise architecture agent JSON.\n"
            + "Compare the agent JSON against ONLY the supplied evidence text.\n"
            + "Penalize claims and findings that introduce facts, services, costs, or controls not supported by the evidence.\n"
            + "Reward outputs that stay grounded in the evidence and cite plausible details.\n"
            + "Return a single JSON object with keys: faithfulnessScore (number 0..1), rationale (short string, max 400 chars).";

        string userPrompt =
            "traceId:" + traceId +
            "\n\nevidence:\n" + evidenceText +
            "\n\nagentJson:\n" + agentJson;

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
