using ArchLucid.Application.Ask;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Host.Core.Ask;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Builds compressed or verbatim conversation history text for Ask prompts.</summary>
public sealed class AskConversationHistoryBuilder(
    IConversationContextCompressor conversationContextCompressor,
    IOptionsMonitor<ConversationContextOptions> conversationContextOptions)
{
    private readonly IConversationContextCompressor _conversationContextCompressor =
        conversationContextCompressor ?? throw new ArgumentNullException(nameof(conversationContextCompressor));

    private readonly IOptionsMonitor<ConversationContextOptions> _conversationContextOptions =
        conversationContextOptions ?? throw new ArgumentNullException(nameof(conversationContextOptions));

    public async Task<string> BuildHistoryTextAsync(
        IReadOnlyList<ConversationMessage> priorMessages,
        CancellationToken cancellationToken)
    {
        ConversationContextOptions opts = _conversationContextOptions.CurrentValue;

        if (!opts.CompressionEnabled || priorMessages.Count <= opts.MaxVerbatimTurns)
            return BuildConversationHistory(priorMessages);

        CompressedConversationContext compressed = await _conversationContextCompressor.CompressAsync(
            priorMessages,
            opts.MaxTurnsToKeepVerbatim,
            cancellationToken);

        List<ConversationMessage> promptMessages = [];

        if (!string.IsNullOrWhiteSpace(compressed.CompressedSummary))
        {
            promptMessages.Add(new ConversationMessage
            {
                Role = ConversationMessageRole.Assistant,
                Content = "[Compressed prior context] " + compressed.CompressedSummary
            });
        }

        promptMessages.AddRange(compressed.RecentVerbatim);

        return BuildConversationHistory(promptMessages);
    }

    /// <summary>Exclude the just-appended user message from the history block (it is repeated as User Question).</summary>
    public static IReadOnlyList<ConversationMessage> TrimCurrentUserTurn(
        IReadOnlyList<ConversationMessage> messages,
        string question)
    {
        if (messages.Count == 0)
            return messages;

        ConversationMessage last = messages[^1];

        if (last.Role == ConversationMessageRole.User &&
            string.Equals(last.Content.Trim(), question, StringComparison.Ordinal))
            return messages.Take(messages.Count - 1).ToList();

        return messages;
    }

    private static string BuildConversationHistory(IReadOnlyList<ConversationMessage> messages)
    {
        if (messages.Count == 0)
            return string.Empty;

        return string.Join(
            Environment.NewLine,
            messages.Select(m => $"{m.Role}: {m.Content}"));
    }
}
