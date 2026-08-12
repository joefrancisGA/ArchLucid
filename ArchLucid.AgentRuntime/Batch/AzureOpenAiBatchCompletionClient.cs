using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Batch;

/// <summary>Azure OpenAI Batch API adapter for offline chat completion workloads.</summary>
public sealed class AzureOpenAiBatchCompletionClient : IBatchAgentCompletionClient
{
    private static readonly HashSet<string> TerminalStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "completed",
        "failed",
        "canceled",
        "expired",
    };

    private readonly IAzureOpenAiBatchTransport _transport;
    private readonly string _deploymentName;
    private readonly IOptionsMonitor<LlmBatchOptions> _batchOptions;
    private readonly ILlmCostEstimator _costEstimator;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<AzureOpenAiBatchCompletionClient> _logger;

    public AzureOpenAiBatchCompletionClient(
        IAzureOpenAiBatchTransport transport,
        string deploymentName,
        IOptionsMonitor<LlmBatchOptions> batchOptions,
        ILlmCostEstimator costEstimator,
        TimeProvider timeProvider,
        ILogger<AzureOpenAiBatchCompletionClient> logger)
    {
        _transport = transport ?? throw new ArgumentNullException(nameof(transport));
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);
        _deploymentName = deploymentName.Trim();
        _batchOptions = batchOptions ?? throw new ArgumentNullException(nameof(batchOptions));
        _costEstimator = costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<BatchChatCompletionResult> Results, BatchAgentCompletionRunSummary Summary)>
        RunChatCompletionsBatchAsync(
            IReadOnlyList<BatchChatCompletionItem> requests,
            CancellationToken cancellationToken)
    {
        if (requests is null || requests.Count < 1)
            throw new ArgumentException("At least one batch request is required.", nameof(requests));

        LlmBatchOptions options = _batchOptions.CurrentValue;
        string jsonl = BuildRequestJsonl(_deploymentName, requests);
        byte[] jsonlBytes = Encoding.UTF8.GetBytes(jsonl);

        string inputFileId = await _transport.UploadBatchInputFileAsync(jsonlBytes, cancellationToken)
            .ConfigureAwait(false);
        string batchJobId = await _transport.CreateBatchJobAsync(inputFileId, cancellationToken)
            .ConfigureAwait(false);

        TimeSpan pollInterval = TimeSpan.FromSeconds(Math.Max(5, options.PollIntervalSeconds));
        TimeSpan maxWait = TimeSpan.FromMinutes(Math.Max(1, options.MaxWaitMinutes));
        DateTimeOffset deadline = _timeProvider.GetUtcNow().Add(maxWait);
        string status = await _transport.GetBatchStatusAsync(batchJobId, cancellationToken).ConfigureAwait(false);

        while (!TerminalStatuses.Contains(status))
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (_timeProvider.GetUtcNow() >= deadline)
            {
                throw new TimeoutException(
                    $"Azure OpenAI batch job {batchJobId} did not complete within {maxWait.TotalMinutes.ToString(CultureInfo.InvariantCulture)} minutes.");
            }

            await Task.Delay(pollInterval, cancellationToken).ConfigureAwait(false);
            status = await _transport.GetBatchStatusAsync(batchJobId, cancellationToken).ConfigureAwait(false);
        }

        if (!string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Azure OpenAI batch job {batchJobId} finished with status '{status}'.");
        }

        string? outputFileId = await _transport.GetBatchOutputFileIdAsync(batchJobId, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(outputFileId))
            throw new InvalidOperationException($"Azure OpenAI batch job {batchJobId} completed without an output file id.");

        string outputJsonl = await _transport.DownloadFileContentAsync(outputFileId, cancellationToken)
            .ConfigureAwait(false);
        IReadOnlyList<BatchChatCompletionResult> results = ParseOutputJsonl(outputJsonl);
        int promptTokens = results.Sum(static r => r.PromptTokens);
        int completionTokens = results.Sum(static r => r.CompletionTokens);
        decimal? syncCost = _costEstimator.EstimateUsd(promptTokens, completionTokens, deploymentLabel: _deploymentName);
        double estimatedSavingsUsd = syncCost is { } cost
            ? (double)cost * Math.Clamp(options.EstimatedDiscountRatio, 0.0, 1.0)
            : 0.0;

        ArchLucidInstrumentation.RecordLlmBatchCompletionRun(
            requests.Count,
            promptTokens,
            completionTokens,
            estimatedSavingsUsd);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Azure OpenAI batch job {BatchJobId} completed with {RequestCount} requests, promptTokens={PromptTokens}, completionTokens={CompletionTokens}, estimatedSavingsUsd={EstimatedSavingsUsd}",
                batchJobId,
                requests.Count,
                promptTokens,
                completionTokens,
                estimatedSavingsUsd);
        }

        BatchAgentCompletionRunSummary summary = new()
        {
            BatchJobId = batchJobId,
            RequestCount = requests.Count,
            TotalPromptTokens = promptTokens,
            TotalCompletionTokens = completionTokens,
            EstimatedSavingsUsd = estimatedSavingsUsd,
            UsedSynchronousFallback = false,
        };

        return (results, summary);
    }

    internal static string BuildRequestJsonl(string deploymentName, IReadOnlyList<BatchChatCompletionItem> requests)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);
        StringBuilder builder = new();

        foreach (BatchChatCompletionItem request in requests)
        {
            JsonObject body = new()
            {
                ["model"] = deploymentName,
                ["messages"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["role"] = "system",
                        ["content"] = request.SystemPrompt,
                    },
                    new JsonObject
                    {
                        ["role"] = "user",
                        ["content"] = request.UserPrompt,
                    },
                },
                ["response_format"] = new JsonObject { ["type"] = "json_object" },
            };

            if (request.MaxTokens is { } maxTokens && maxTokens > 0)
                body["max_tokens"] = maxTokens;

            if (request.Temperature is { } temperature)
                body["temperature"] = temperature;

            JsonObject line = new()
            {
                ["custom_id"] = request.CustomId,
                ["method"] = "POST",
                ["url"] = "/v1/chat/completions",
                ["body"] = body,
            };

            builder.AppendLine(line.ToJsonString());
        }

        return builder.ToString();
    }

    internal static IReadOnlyList<BatchChatCompletionResult> ParseOutputJsonl(string jsonl)
    {
        if (string.IsNullOrWhiteSpace(jsonl))
            return [];

        List<BatchChatCompletionResult> results = [];
        string[] lines = jsonl.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string line in lines)
        {
            using JsonDocument doc = JsonDocument.Parse(line);
            JsonElement root = doc.RootElement;
            string customId = root.GetProperty("custom_id").GetString() ?? string.Empty;
            JsonElement response = root.GetProperty("response");
            JsonElement body = response.GetProperty("body");
            JsonElement choices = body.GetProperty("choices");
            JsonElement message = choices[0].GetProperty("message");
            string assistantText = message.GetProperty("content").GetString() ?? string.Empty;
            int promptTokens = 0;
            int completionTokens = 0;

            if (body.TryGetProperty("usage", out JsonElement usage))
            {
                if (usage.TryGetProperty("prompt_tokens", out JsonElement prompt))
                    promptTokens = prompt.GetInt32();

                if (usage.TryGetProperty("completion_tokens", out JsonElement completion))
                    completionTokens = completion.GetInt32();
            }

            results.Add(new BatchChatCompletionResult
            {
                CustomId = customId,
                AssistantText = assistantText,
                PromptTokens = promptTokens,
                CompletionTokens = completionTokens,
            });
        }

        return results;
    }
}
