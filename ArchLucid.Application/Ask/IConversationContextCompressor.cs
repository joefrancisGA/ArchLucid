using ArchLucid.Core.Conversation;

namespace ArchLucid.Application.Ask;

public interface IConversationContextCompressor
{
    Task<CompressedConversationContext> CompressAsync(
        IReadOnlyList<ConversationMessage> history,
        int maxTurnsToKeepVerbatim,
        CancellationToken cancellationToken);
}
