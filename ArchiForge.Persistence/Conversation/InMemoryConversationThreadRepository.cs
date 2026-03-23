using ArchiForge.Core.Conversation;

namespace ArchiForge.Persistence.Conversation;

/// <summary>
/// Thread-safe in-memory <see cref="IConversationThreadRepository"/> for tests and storage-off mode.
/// </summary>
public sealed class InMemoryConversationThreadRepository : IConversationThreadRepository
{
    private readonly List<ConversationThread> _threads = [];

    /// <inheritdoc />
    public Task CreateAsync(ConversationThread thread, CancellationToken ct)
    {
        lock (_threads)
            _threads.Add(thread);
        return Task.CompletedTask;
    }

    public Task<ConversationThread?> GetByIdAsync(Guid threadId, CancellationToken ct)
    {
        lock (_threads)
            return Task.FromResult(_threads.FirstOrDefault(x => x.ThreadId == threadId));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ConversationThread>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        lock (_threads)
        {
            var result = _threads
                .Where(x => x.TenantId == tenantId &&
                            x.WorkspaceId == workspaceId &&
                            x.ProjectId == projectId)
                .OrderByDescending(x => x.LastUpdatedUtc)
                .Take(take)
                .ToList();
            return Task.FromResult<IReadOnlyList<ConversationThread>>(result);
        }
    }

    /// <inheritdoc />
    public Task UpdateLastUpdatedAsync(Guid threadId, DateTime updatedUtc, CancellationToken ct)
    {
        lock (_threads)
        {
            var thread = _threads.FirstOrDefault(x => x.ThreadId == threadId);
            if (thread is not null)
                thread.LastUpdatedUtc = updatedUtc;
        }

        return Task.CompletedTask;
    }
}
