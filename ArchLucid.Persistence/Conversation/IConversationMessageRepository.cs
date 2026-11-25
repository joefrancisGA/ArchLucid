using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Conversation;

/// <summary>
///     Persistence for <see cref="ConversationMessage" /> rows used by Ask.
/// </summary>
/// <remarks>
///     SQL: <see cref="DapperConversationMessageRepository" />; in-memory:
///     <see cref="InMemoryConversationMessageRepository" />.
///     Primary caller: <c>ArchLucid.Api.Ask.ConversationService</c>.
/// </remarks>
public interface IConversationMessageRepository
{
    /// <summary>Appends a message row.</summary>
    Task AddAsync(ConversationMessage message, CancellationToken ct);

    /// <summary>Recent immutable proof headers in chronological order, without message bodies or unrelated metadata.</summary>
    Task<IReadOnlyList<ConversationProofRow>> GetRecentProofsAsync(
        ScopeContext scope, Guid threadId, int take, CancellationToken ct);

    /// <summary>Loads only the message IDs authorized by the caller's proof check, in the exact thread and scope.</summary>
    Task<IReadOnlyList<ConversationMessage>> GetAuthorizedMessagesAsync(
        ScopeContext scope, Guid threadId, IReadOnlyCollection<Guid> messageIds, CancellationToken ct);
}
