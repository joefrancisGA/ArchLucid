using System.Text.Json;

using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Agentic;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     LLM-backed single-pass query rewrite and HyDE generation (RAG-V2-002).
///     One completion per transform — not an iterative retrieve-critique-retry loop.
/// </summary>
public sealed class AgenticRetrievalCompletionClient(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<AdvancedRetrievalOptions> optionsMonitor,
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

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<AgenticRetrievalCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        string? rewritten = await TryCompleteWithExpansionBudgetAsync(
            (completionClient, ct) => completionClient.CompleteJsonAsync(
                RewriteSystemPrompt,
                queryText,
                maxTokens: 120,
                temperature: 0.1f,
                ct),
            "query rewrite",
            cancellationToken).ConfigureAwait(false);

        if (rewritten is not null)
            return rewritten;

        return AgenticRetrievalHeuristics.RewriteQuery(queryText);
    }

    /// <inheritdoc />
    public async Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        string? hyde = await TryCompleteWithExpansionBudgetAsync(
            (completionClient, ct) => completionClient.CompleteJsonAsync(
                HydeSystemPrompt,
                queryText,
                maxTokens: 200,
                temperature: 0.2f,
                ct),
            "HyDE generation",
            cancellationToken).ConfigureAwait(false);

        if (hyde is not null)
            return hyde;

        return AgenticRetrievalHeuristics.GenerateHydeDocument(queryText);
    }

    /// <inheritdoc />
    public async Task<RetrievalCritiqueVerdict> CritiqueRetrievalAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        string? critiqueJson = await TryCompleteWithExpansionBudgetAsync(
            (completionClient, ct) => completionClient.CompleteJsonAsync(
                "Critique whether retrieved chunks answer the query. "
                + "Return JSON: {\"isSufficient\":boolean,\"refinedQueryText\":string|null}. "
                + "Set refinedQueryText only when more retrieval is needed.",
                $"Query: {queryText.Trim()}\nHit count: {hits.Count}",
                maxTokens: 120,
                temperature: 0.1f,
                ct),
            "retrieval critique",
            cancellationToken).ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(critiqueJson))
        {
            try
            {
                using JsonDocument document = JsonDocument.Parse(critiqueJson);

                JsonElement root = document.RootElement;

                bool isSufficient = root.TryGetProperty("isSufficient", out JsonElement sufficientElement)
                    && sufficientElement.ValueKind == JsonValueKind.True;

                string? refined = root.TryGetProperty("refinedQueryText", out JsonElement refinedElement)
                    && refinedElement.ValueKind == JsonValueKind.String
                    ? refinedElement.GetString()
                    : null;

                return new RetrievalCritiqueVerdict
                {
                    IsSufficient = isSufficient,
                    RefinedQueryText = refined,
                };
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Retrieval critique JSON parse failed; falling back to heuristics.");
            }
        }

        return AgenticRetrievalHeuristics.CritiqueRetrieval(queryText, hits);
    }

    private async Task<string?> TryCompleteWithExpansionBudgetAsync(
        Func<IAgentCompletionClient, CancellationToken, Task<string>> completeAsync,
        string operationLabel,
        CancellationToken cancellationToken)
    {
        TimeSpan budget = _optionsMonitor.CurrentValue.GetEffectiveExpansionTimeout();

        using CancellationTokenSource budgetSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        budgetSource.CancelAfter(budget);

        try
        {
            (IAgentCompletionClient completionClient, _) =
                _tierCompletionRouter.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

            string result = await completeAsync(completionClient, budgetSource.Token).ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(result))
                return null;

            return result.Trim();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning(
                "Single-pass query expansion {Operation} exceeded {BudgetSeconds:N0}s; falling back to heuristics.",
                operationLabel,
                budget.TotalSeconds);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Single-pass query expansion {Operation} failed; falling back to heuristics.",
                operationLabel);
        }

        return null;
    }
}
