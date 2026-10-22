using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Uses the fast agent completion tier to summarize knowledge-graph communities (TB-877).</summary>
public sealed class GraphCommunitySummaryCompletionClient(
    IAgentTierCompletionRouter tierCompletionRouter,
    IBatchAgentCompletionClient batchCompletionClient,
    IOptionsMonitor<LlmBatchOptions> batchOptions,
    ILlmBatchRoutingContext batchRoutingContext,
    ILogger<GraphCommunitySummaryCompletionClient> logger) : IGraphCommunitySummaryCompletionClient
{
    private const string SystemPrompt =
        "Summarize the architecture graph community in 4-6 bullet points. Preserve resource names, "
        + "relationship themes, and policy/security context. Do not invent facts.";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IBatchAgentCompletionClient _batchCompletionClient =
        batchCompletionClient ?? throw new ArgumentNullException(nameof(batchCompletionClient));

    private readonly IOptionsMonitor<LlmBatchOptions> _batchOptions =
        batchOptions ?? throw new ArgumentNullException(nameof(batchOptions));

    private readonly ILlmBatchRoutingContext _batchRoutingContext =
        batchRoutingContext ?? throw new ArgumentNullException(nameof(batchRoutingContext));

    private readonly ILogger<GraphCommunitySummaryCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> SummarizeCommunityAsync(string communityContext, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(communityContext))
            return string.Empty;

        LlmBatchOptions options = _batchOptions.CurrentValue;

        if (options.Enabled && options.RouteManifestSummarization && _batchRoutingContext.UseBatchPath)
        {
            try
            {
                BatchChatCompletionItem item = new(Guid.NewGuid().ToString("N"), SystemPrompt, communityContext)
                {
                    MaxTokens = 500,
                    Temperature = 0.1f,
                };

                (IReadOnlyList<BatchChatCompletionResult> results, _) =
                    await _batchCompletionClient.RunChatCompletionsBatchAsync([item], cancellationToken)
                        .ConfigureAwait(false);

                string summary = results[0].AssistantText;

                return string.IsNullOrWhiteSpace(summary) ? communityContext : summary.Trim();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Graph community batch summarization failed; falling back to synchronous completion.");
                }
            }
        }

        (IAgentCompletionClient completionClient, _) =
            _tierCompletionRouter.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

        try
        {
            string summary = await completionClient
                .CompleteJsonAsync(SystemPrompt, communityContext, maxTokens: 500, temperature: 0.1f, cancellationToken)
                .ConfigureAwait(false);

            return string.IsNullOrWhiteSpace(summary) ? communityContext : summary.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Graph community summarization failed; returning truncated source text.");

            return communityContext.Length <= 2_000 ? communityContext : communityContext[..2_000];
        }
    }
}
