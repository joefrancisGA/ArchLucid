using ArchLucid.Core.Conversation;

namespace ArchLucid.Application.Ask;

/// <summary>Output of <see cref="IConversationContextCompressor" />.</summary>
public sealed class CompressedConversationContext
{
    public string CompressedSummary
    {
        get;
        init;
    } = "";

    public IReadOnlyList<ConversationMessage> RecentVerbatim
    {
        get;
        init;
    } = [];
}
