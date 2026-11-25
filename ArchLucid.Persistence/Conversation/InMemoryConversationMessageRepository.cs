using System.Data.SqlTypes;

using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Conversation;

/// <summary>
///     Thread-safe in-memory <see cref="IConversationMessageRepository" /> for tests and storage-off mode.
/// </summary>
public sealed class InMemoryConversationMessageRepository(IConversationThreadRepository? threads = null)
    : IConversationMessageRepository
{
    private const int MaxEntries = 2000;
    private readonly Lock _gate = new();
    private readonly List<ConversationMessage> _messages = [];

    /// <inheritdoc />
    public Task AddAsync(ConversationMessage message, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(message);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_messages.Any(existing => existing.MessageId == message.MessageId))
                throw new InvalidOperationException($"Conversation message '{message.MessageId}' already exists.");

            _messages.Add(message);
            if (_messages.Count > MaxEntries)
                _messages.RemoveRange(0, _messages.Count - MaxEntries);
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<ConversationProofRow>> GetRecentProofsAsync(
        ScopeContext scope, Guid threadId, int take, CancellationToken ct)
    {
        if (!await IsInScopeAsync(scope, threadId, ct))
            return [];

        lock (_gate)
        {
            return _messages.Where(m => m.ThreadId == threadId)
                .OrderByDescending(m => m.CreatedUtc).ThenByDescending(m => new SqlGuid(m.MessageId))
                .Take(Math.Clamp(take, 1, 500))
                .Select(ConversationProofRow.FromStoredMetadata)
                .OrderBy(m => m.CreatedUtc).ThenBy(m => new SqlGuid(m.MessageId)).ToList();
        }
    }

    public async Task<IReadOnlyList<ConversationMessage>> GetAuthorizedMessagesAsync(
        ScopeContext scope, Guid threadId, IReadOnlyCollection<Guid> messageIds, CancellationToken ct)
    {
        if (messageIds.Count == 0 || messageIds.Count > 500 || !await IsInScopeAsync(scope, threadId, ct))
            return [];

        var ids = messageIds.ToHashSet();
        lock (_gate)
        {
            return _messages.Where(m => m.ThreadId == threadId && ids.Contains(m.MessageId))
                .OrderBy(m => m.CreatedUtc).ThenBy(m => new SqlGuid(m.MessageId)).ToList();
        }
    }

    private async Task<bool> IsInScopeAsync(ScopeContext scope, Guid threadId, CancellationToken ct)
    {
        if (threads is null || threadId == Guid.Empty || scope.TenantId == Guid.Empty ||
            scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty)
            return false;

        ConversationThread? thread = await threads.GetByIdAsync(threadId, ct);
        return thread is not null && thread.ThreadId == threadId && !thread.ArchivedUtc.HasValue &&
               thread.TenantId == scope.TenantId && thread.WorkspaceId == scope.WorkspaceId && thread.ProjectId == scope.ProjectId;
    }
}
