using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Agentic;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>LLM-backed query rewrite and HyDE generation for agentic retrieval.</summary>
public sealed class AgenticRetrievalCompletionClient(
    IAgentTierCompletionRouter tierCompletionRouter,
    ILogger<AgenticRetrievalCompletionClient> logger) : IAgenticRetrievalCompletionClient
{
    private const string RewriteSystemPrompt =
        "Rewrite the user query for semantic retrieval over enterprise architecture policy packs, "
        + "prior manifests, and knowledge-graph nodes. Preserve intent; add no facts. Return plain text only.";

    private const string HydeSystemPrompt =
        "Write a short hypothetical architecture review excerpt (2-4 sentences) that would answer the query. "
        + "Use enterprise architecture vocabulary. Return plain text only.";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly ILogger<AgenticRetrievalCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        try
        {
            (IAgentCompletionClient completionClient, _) =
                _tierCompletionRouter.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

            string rewritten = await completionClient
                .CompleteJsonAsync(RewriteSystemPrompt, queryText, maxTokens: 120, temperature: 0.1f, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(rewritten))
                return rewritten.Trim();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "LLM query rewrite failed; falling back to heuristic rewrite.");
        }

        return AgenticRetrievalHeuristics.RewriteQuery(queryText);
    }

    /// <inheritdoc />
    public async Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        try
        {
            (IAgentCompletionClient completionClient, _) =
                _tierCompletionRouter.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

            string hyde = await completionClient
                .CompleteJsonAsync(HydeSystemPrompt, queryText, maxTokens: 200, temperature: 0.2f, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(hyde))
                return hyde.Trim();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "LLM HyDE generation failed; falling back to heuristic HyDE.");
        }

        return AgenticRetrievalHeuristics.GenerateHydeDocument(queryText);
    }
}
