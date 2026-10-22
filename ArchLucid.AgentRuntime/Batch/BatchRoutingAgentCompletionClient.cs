using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Batch;

/// <summary>
///     Routes <see cref="IAgentCompletionClient" /> calls through <see cref="IBatchAgentCompletionClient" /> on offline paths
///     when batch mode is enabled; otherwise delegates to the synchronous inner client.
/// </summary>
public sealed class BatchRoutingAgentCompletionClient(
    IAgentCompletionClient inner,
    IBatchAgentCompletionClient batchClient,
    IOptionsMonitor<LlmBatchOptions> batchOptions,
    ILlmBatchRoutingContext routingContext,
    ILogger<BatchRoutingAgentCompletionClient> logger,
    Func<LlmBatchOptions, bool> routeWhenEnabled) : IAgentCompletionClient
{
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    private readonly IBatchAgentCompletionClient _batchClient =
        batchClient ?? throw new ArgumentNullException(nameof(batchClient));

    private readonly IOptionsMonitor<LlmBatchOptions> _batchOptions =
        batchOptions ?? throw new ArgumentNullException(nameof(batchOptions));

    private readonly ILlmBatchRoutingContext _routingContext =
        routingContext ?? throw new ArgumentNullException(nameof(routingContext));

    private readonly ILogger<BatchRoutingAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly Func<LlmBatchOptions, bool> _routeWhenEnabled =
        routeWhenEnabled ?? throw new ArgumentNullException(nameof(routeWhenEnabled));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        LlmBatchOptions options = _batchOptions.CurrentValue;

        if (!options.Enabled || !_routingContext.UseBatchPath || !_routeWhenEnabled(options))
            return await _inner
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);

        try
        {
            BatchChatCompletionItem item = new(Guid.NewGuid().ToString("N"), systemPrompt, userPrompt)
            {
                MaxTokens = maxTokens,
                Temperature = temperature,
            };

            (IReadOnlyList<BatchChatCompletionResult> results, BatchAgentCompletionRunSummary summary) =
                await _batchClient.RunChatCompletionsBatchAsync([item], cancellationToken).ConfigureAwait(false);

            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Batch completion routed via job {BatchJobId} (requests={RequestCount}, estimatedSavingsUsd={EstimatedSavingsUsd})",
                    summary.BatchJobId,
                    summary.RequestCount,
                    summary.EstimatedSavingsUsd);
            }

            return results[0].AssistantText;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Batch completion failed; falling back to synchronous Azure OpenAI chat completion.");
            }

            return await _inner
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                .ConfigureAwait(false);
        }
    }
}
