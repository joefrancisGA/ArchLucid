using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Rubric-based semantic judge using Azure OpenAI JSON completions (distinct deployment supported).</summary>
public sealed class AgentOutputLlmSemanticJudge(
    IOptionsMonitor<AzureOpenAiOptions> azureOptions,
    IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> judgeOptions,
    IOptionsMonitor<AgentExecutionOptions> agentExecutionOptions,
    ILogger<AgentOutputLlmSemanticJudge> logger) : IAgentOutputLlmSemanticJudge
{
    private readonly Lock _clientLock = new();
    private readonly IOptionsMonitor<AzureOpenAiOptions> _azureOptions =
        azureOptions ?? throw new ArgumentNullException(nameof(azureOptions));

    private readonly IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> _judgeOptions =
        judgeOptions ?? throw new ArgumentNullException(nameof(judgeOptions));

    private readonly IOptionsMonitor<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly ILogger<AgentOutputLlmSemanticJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private AzureOpenAiCompletionClient? _cachedClient;
    private string _clientFingerprint = string.Empty;

    /// <summary>
    ///     Null when the judge is disabled, the run is in Simulator mode (optional), credentials are missing, or every sample
    ///     failed (caller falls back to heuristic).
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

        if (!judgeOpts.Enabled)
            return null;

        AgentExecutionOptions exec = _agentExecutionOptions.CurrentValue;

        if (judgeOpts.SkipWhenSimulator
            && string.Equals(exec.Mode.Trim(), "Simulator", StringComparison.OrdinalIgnoreCase))
            return null;

        AzureOpenAiCompletionClient? client = AcquireClientLocked(judgeOpts);

        if (client is null)
            return null;

        string userPayload = TrimForJudge(parsedResultJson, judgeOpts.MaxInputCharacters);
        string systemPrompt = BuildSystemPrompt(agentType);
        string userPrompt = "traceId:" + traceId + "\nagentJson:\n" + userPayload;

        int sampleCount = Math.Clamp(judgeOpts.JudgeInvocationCount, 1, 8);

        if (sampleCount == 1)

            return await InvokeJudgeSampleAsync(client, judgeOpts, traceId, systemPrompt, userPrompt, cancellationToken)
                .ConfigureAwait(false);

        Task<AgentOutputLlmJudgeParsedResult?>[] tasks = new Task<AgentOutputLlmJudgeParsedResult?>[sampleCount];

        for (int i = 0; i < sampleCount; i++)

            tasks[i] =
                InvokeJudgeSampleAsync(client, judgeOpts, traceId, systemPrompt, userPrompt, cancellationToken);

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

    private async Task<AgentOutputLlmJudgeParsedResult?> InvokeJudgeSampleAsync(
        AzureOpenAiCompletionClient client,
        AgentOutputLlmSemanticJudgeOptions judgeOpts,
        string traceId,
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        using CancellationTokenSource linked =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        linked.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, judgeOpts.TimeoutSeconds)));

        try
        {
            string raw = await client.CompleteJsonAsync(systemPrompt, userPrompt, linked.Token).ConfigureAwait(false);

            return TryParseJudgeResponse(raw);
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM semantic judge timed out for TraceId={TraceId}", traceId);

            return null;
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "LLM semantic judge failed for TraceId={TraceId}", traceId);

            return null;
        }
    }

    private static double MedianOfDoubles(IReadOnlyList<double> values)
    {
        List<double> sorted = values.OrderBy(static x => x).ToList();

        int mid = sorted.Count / 2;

        return sorted.Count % 2 == 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2.0;
    }

    private static double PopulationStdDev(List<double> values)
    {
        if (values.Count < 2)
            return 0.0;

        double mean = values.Average();
        double sq = values.Sum(v =>
        {
            double d = v - mean;

            return d * d;
        });

        return Math.Sqrt(sq / values.Count);
    }

    private AzureOpenAiCompletionClient? AcquireClientLocked(AgentOutputLlmSemanticJudgeOptions judgeOpts)
    {
        AzureOpenAiOptions azure = _azureOptions.CurrentValue;
        string endpoint = azure.Endpoint.Trim();
        string apiKey = azure.ApiKey.Trim();
        string deployment = string.IsNullOrWhiteSpace(judgeOpts.DeploymentName)
            ? azure.DeploymentName.Trim()
            : judgeOpts.DeploymentName.Trim();

        int maxTok = judgeOpts.MaxCompletionTokens > 0
            ? judgeOpts.MaxCompletionTokens
            : Math.Min(AzureOpenAiCompletionClient.DefaultMaxCompletionTokens, 512);

        if (string.IsNullOrWhiteSpace(endpoint) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(deployment))
            return null;

        string fingerprint = $"{endpoint}|{deployment}|{apiKey.Length}|{maxTok}";

        lock (_clientLock)
        {
            if (_cachedClient is not null && string.Equals(_clientFingerprint, fingerprint, StringComparison.Ordinal))
                return _cachedClient;

            _cachedClient = new AzureOpenAiCompletionClient(endpoint, apiKey, deployment, maxTok);
            _clientFingerprint = fingerprint;

            return _cachedClient;
        }
    }

    private static string TrimForJudge(string json, int maxChars)
    {
        maxChars = Math.Max(4096, maxChars);

        if (json.Length <= maxChars)
            return json;

        return json.Substring(0, maxChars) +
               "\n…truncated_total_chars=" +
               json.Length.ToString(CultureInfo.InvariantCulture);
    }

    private static string BuildSystemPrompt(AgentType agentType)
    {
        return "You are a strict output-quality rater for enterprise architecture review JSON (AgentResult).\n"
               + "Given one JSON object, rate how well it is internally consistent and evidence-backed.\n"
               + "Penalize uncited claims (no evidenceRefs and no evidence string), vague or empty findings, and "
               + "obvious internal contradictions.\n"
               + "Do not invent facts from outside the JSON.\n"
               + "Agent role: " +
               agentType +
               ".\nReturn a single JSON object with keys: overallQuality (number 0..1), rationale (short string, "
               + "max 400 chars, plain text).";
    }

    private static AgentOutputLlmJudgeParsedResult? TryParseJudgeResponse(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(raw.Trim());

            JsonElement root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                return null;

            double q = ReadQuality(root);

            if (double.IsNaN(q) || double.IsInfinity(q))
                return null;

            q = Math.Clamp(q, 0.0, 1.0);
            string? rationale = ReadRationale(root);

            return new AgentOutputLlmJudgeParsedResult(q, rationale);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static double ReadQuality(JsonElement root)
    {
        if (root.TryGetProperty("overallQuality", out JsonElement named) && TryGetDouble(named, out double v1))
            return v1;

        if (root.TryGetProperty("overall_quality", out JsonElement snake) && TryGetDouble(snake, out double v2))
            return v2;

        return double.NaN;
    }

    private static bool TryGetDouble(JsonElement e, out double value)
    {
        if (e.ValueKind == JsonValueKind.Number && e.TryGetDouble(out value))
            return true;

        if (e.ValueKind == JsonValueKind.String && double.TryParse(e.GetString(), CultureInfo.InvariantCulture, out value))
            return true;

        value = double.NaN;

        return false;
    }

    private static string? ReadRationale(JsonElement root)
    {
        if (!root.TryGetProperty("rationale", out JsonElement r) || r.ValueKind != JsonValueKind.String)
            return null;

        string? s = r.GetString();

        if (string.IsNullOrWhiteSpace(s))
            return null;

        string t = s.Trim();

        return t.Length <= 400 ? t : t[..400];

    }
}
