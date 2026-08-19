using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Uses the fast agent completion tier to summarize oversized manifest retrieval chunks.</summary>
public sealed class ManifestChunkSummaryCompletionClient(
    IAgentTierCompletionRouter tierCompletionRouter,
    IBatchAgentCompletionClient batchCompletionClient,
    IOptionsMonitor<LlmBatchOptions> batchOptions,
    ILlmBatchRoutingContext batchRoutingContext,
    ILogger<ManifestChunkSummaryCompletionClient> logger) : IManifestChunkSummaryCompletionClient
{
    private const string SystemPrompt =
        "Summarize the manifest excerpt in 3-5 bullet points. Preserve resource names, SKUs, regions, "
        + "and policy identifiers. Do not invent facts.";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IBatchAgentCompletionClient _batchCompletionClient =
        batchCompletionClient ?? throw new ArgumentNullException(nameof(batchCompletionClient));

    private readonly IOptionsMonitor<LlmBatchOptions> _batchOptions =
        batchOptions ?? throw new ArgumentNullException(nameof(batchOptions));

    private readonly ILlmBatchRoutingContext _batchRoutingContext =
        batchRoutingContext ?? throw new ArgumentNullException(nameof(batchRoutingContext));

    private readonly ILogger<ManifestChunkSummaryCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> SummarizeChunkAsync(string chunkText, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(chunkText))
            return string.Empty;

        LlmBatchOptions options = _batchOptions.CurrentValue;

        if (options.Enabled && options.RouteManifestSummarization && _batchRoutingContext.UseBatchPath)
        {
            try
            {
                BatchChatCompletionItem item = new(Guid.NewGuid().ToString("N"), SystemPrompt, chunkText)
                {
                    MaxTokens = 400,
                    Temperature = 0.1f,
                };

                (IReadOnlyList<BatchChatCompletionResult> results, _) =
                    await _batchCompletionClient.RunChatCompletionsBatchAsync([item], cancellationToken)
                        .ConfigureAwait(false);

                string summary = results[0].AssistantText;

                return string.IsNullOrWhiteSpace(summary) ? chunkText : summary.Trim();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Manifest chunk batch summarization failed; falling back to synchronous completion.");
                }
            }
        }

        (IAgentCompletionClient completionClient, _) =
            _tierCompletionRouter.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

        try
        {
            string summary = await completionClient
                .CompleteJsonAsync(SystemPrompt, chunkText, maxTokens: 400, temperature: 0.1f, cancellationToken)
                .ConfigureAwait(false);

            return string.IsNullOrWhiteSpace(summary) ? chunkText : summary.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Manifest chunk summarization failed; returning truncated source text.");

            return chunkText.Length <= 1_500 ? chunkText : chunkText[..1_500];
        }
    }
}
