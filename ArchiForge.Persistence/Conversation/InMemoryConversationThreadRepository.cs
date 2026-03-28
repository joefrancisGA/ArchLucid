using ArchiForge.Core.Conversation;
using ArchiForge.Core.Pagination;

namespace ArchiForge.Persistence.Conversation;

/// <summary>
/// Thread-safe in-memory <see cref="IConversationThreadRepository"/> for tests and storage-off mode.
/// </summary>
public sealed class InMemoryConversationThreadRepository : IConversationThreadRepository
{
    private const int MaxEntries = 500;
    private readonly Lock _gate = new();
    private readonly List<ConversationThread> _threads = [];

    /// <inheritdoc />
    public Task CreateAsync(ConversationThread thread, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(thread);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _threads.Add(thread);
            if (_threads.Count > MaxEntries)
                _threads.RemoveRange(0, _threads.Count - MaxEntries);
        }
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<ConversationThread?> GetByIdAsync(Guid threadId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
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
        ct.ThrowIfCancellationRequested();
        take = Math.Clamp(take, 1, 200);
        lock (_gate)
        {
            List<ConversationThread> result = _threads
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
    public Task<(IReadOnlyList<ConversationThread> Items, int TotalCount)> ListByScopePagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int skip,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        take = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
        skip = Math.Max(skip, 0);

        lock (_gate)
        {
            List<ConversationThread> ordered = _threads
                .Where(x => x.TenantId == tenantId &&
                            x.WorkspaceId == workspaceId &&
                            x.ProjectId == projectId)
                .OrderByDescending(x => x.LastUpdatedUtc)
                .ToList();
            int total = ordered.Count;
            List<ConversationThread> page = ordered.Skip(skip).Take(take).ToList();
            return Task.FromResult<(IReadOnlyList<ConversationThread>, int)>((page, total));
        }
    }

    /// <inheritdoc />
    public Task UpdateLastUpdatedAsync(Guid threadId, DateTime updatedUtc, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            ConversationThread? thread = _threads.FirstOrDefault(x => x.ThreadId == threadId);
            if (thread is not null)
                thread.LastUpdatedUtc = updatedUtc;
        }

        return Task.CompletedTask;
    }
}
