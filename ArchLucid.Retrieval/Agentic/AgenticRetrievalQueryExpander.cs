using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Agentic;

/// <inheritdoc cref="IAgenticRetrievalQueryExpander" />
public sealed class AgenticRetrievalQueryExpander(
    IAgenticRetrievalCompletionClient completionClient,
    IOptionsMonitor<AdvancedRetrievalOptions> optionsMonitor,
    ILogger<AgenticRetrievalQueryExpander> logger) : IAgenticRetrievalQueryExpander
{
    private readonly IAgenticRetrievalCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<AgenticRetrievalQueryExpander> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<AgenticRetrievalQueryPlan> ExpandAsync(string queryText, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);

        AdvancedRetrievalOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return BuildPassthroughPlan(queryText);

        string rewritten = queryText.Trim();
        bool usedRewrite = false;

        if (options.EnableQueryRewrite)
        {
            try
            {
                string llmRewrite = await _completionClient
                    .RewriteQueryAsync(queryText, cancellationToken)
                    .ConfigureAwait(false);

                if (!string.IsNullOrWhiteSpace(llmRewrite) && !string.Equals(llmRewrite.Trim(), rewritten, StringComparison.Ordinal))
                {
                    rewritten = llmRewrite.Trim();
                    usedRewrite = true;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Agentic query rewrite failed; using heuristic rewrite.");

                rewritten = AgenticRetrievalHeuristics.RewriteQuery(queryText);
                usedRewrite = !string.Equals(rewritten, queryText.Trim(), StringComparison.Ordinal);
            }
        }

        string embedText = rewritten;
        bool usedHyde = false;

        if (options.EnableHyde)
        {
            try
            {
                string hydeDoc = await _completionClient
                    .GenerateHydeDocumentAsync(rewritten, cancellationToken)
                    .ConfigureAwait(false);

                if (!string.IsNullOrWhiteSpace(hydeDoc))
                {
                    embedText = hydeDoc.Trim();
                    usedHyde = true;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "HyDE generation failed; using heuristic HyDE document.");

                embedText = AgenticRetrievalHeuristics.GenerateHydeDocument(rewritten);
                usedHyde = true;
            }
        }

        return new AgenticRetrievalQueryPlan
        {
            OriginalQueryText = queryText,
            RerankQueryText = rewritten,
            EmbedText = embedText,
            UsedHyde = usedHyde,
            UsedQueryRewrite = usedRewrite,
        };
    }

    internal static AgenticRetrievalQueryPlan BuildPassthroughPlan(string queryText)
    {
        string trimmed = queryText.Trim();

        return new AgenticRetrievalQueryPlan
        {
            OriginalQueryText = queryText,
            RerankQueryText = trimmed,
            EmbedText = trimmed,
            UsedHyde = false,
            UsedQueryRewrite = false,
        };
    }
}
