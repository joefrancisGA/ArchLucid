using ArchLucid.Core.Conversation;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Ask;

/// <summary>Summarizes older Ask turns with a fast completion client; fail-open on errors (TB-195).</summary>
public sealed class ConversationContextCompressor(
    IAgentCompletionClient completionClient,
    ILogger<ConversationContextCompressor> logger) : IConversationContextCompressor
{
    private const string SystemPrompt =
        "Summarize this conversation history. Preserve all finding IDs, decision names, numeric values, "
        + "and open questions. Output dense plain text under 500 words.";

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<ConversationContextCompressor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<CompressedConversationContext> CompressAsync(
        IReadOnlyList<ConversationMessage> history,
        int maxTurnsToKeepVerbatim,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(history);

        if (history.Count == 0)
        {
            return new CompressedConversationContext
            {
                CompressedSummary = "",
                RecentVerbatim = []
            };
        }

        int keepCount = Math.Clamp(maxTurnsToKeepVerbatim, 1, history.Count);

        if (history.Count <= keepCount)
        {
            return new CompressedConversationContext
            {
                CompressedSummary = "",
                RecentVerbatim = history
            };
        }

        int olderCount = history.Count - keepCount;
        IReadOnlyList<ConversationMessage> older = history.Take(olderCount).ToArray();
        IReadOnlyList<ConversationMessage> recent = history.Skip(olderCount).ToArray();
        string olderText = BuildPlainHistory(older);

        try
        {
            string? summary = await _completionClient
                .CompleteJsonAsync(SystemPrompt, olderText, maxTokens: 800, temperature: 0.1f, cancellationToken)
                .ConfigureAwait(false);

            return new CompressedConversationContext
            {
                CompressedSummary = string.IsNullOrWhiteSpace(summary) ? "" : summary.Trim(),
                RecentVerbatim = recent
            };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ask conversation compression failed; using full verbatim history.");
            return new CompressedConversationContext
            {
                CompressedSummary = "",
                RecentVerbatim = history
            };
        }
    }

    private static string BuildPlainHistory(IReadOnlyList<ConversationMessage> messages) =>
        string.Join(
            Environment.NewLine,
            messages.Select(m => $"{m.Role}: {m.Content}"));
}
