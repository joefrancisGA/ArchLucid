using ArchiForge.Core.Conversation;

namespace ArchiForge.Persistence.Conversation;

/// <summary>
/// Thread-safe in-memory <see cref="IConversationMessageRepository"/> for tests and storage-off mode.
/// </summary>
public sealed class InMemoryConversationMessageRepository : IConversationMessageRepository
{
    private readonly List<ConversationMessage> _messages = [];

    /// <inheritdoc />
    public Task AddAsync(ConversationMessage message, CancellationToken ct)
    {
        lock (_messages)
            _messages.Add(message);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ConversationMessage>> GetByThreadIdAsync(
        Guid threadId,
        int take,
        CancellationToken ct)
    {
        lock (_messages)
        {
            var result = _messages
                .Where(x => x.ThreadId == threadId)
                .OrderByDescending(x => x.CreatedUtc)
                .Take(take)
                .OrderBy(x => x.CreatedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<ConversationMessage>>(result);
        }
    }
}
