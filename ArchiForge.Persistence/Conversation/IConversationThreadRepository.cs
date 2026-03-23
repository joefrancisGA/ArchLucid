using ArchiForge.Core.Conversation;

namespace ArchiForge.Persistence.Conversation;

/// <summary>
/// Persistence for <see cref="ConversationThread"/> rows used by Ask.
/// </summary>
/// <remarks>
/// SQL: <see cref="DapperConversationThreadRepository"/>; in-memory: <see cref="InMemoryConversationThreadRepository"/>.
/// Primary caller: <c>ArchiForge.Api.Ask.ConversationService</c>.
/// </remarks>
public interface IConversationThreadRepository
{
    /// <summary>Inserts a new thread row.</summary>
    Task CreateAsync(ConversationThread thread, CancellationToken ct);

    /// <summary>Loads by id, or <see langword="null"/> if missing.</summary>
    Task<ConversationThread?> GetByIdAsync(Guid threadId, CancellationToken ct);

    /// <summary>Lists recent threads for a scope, newest <see cref="ConversationThread.LastUpdatedUtc"/> first.</summary>
    Task<IReadOnlyList<ConversationThread>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct);

    /// <summary>Sets <see cref="ConversationThread.LastUpdatedUtc"/> after a message append.</summary>
    Task UpdateLastUpdatedAsync(Guid threadId, DateTime updatedUtc, CancellationToken ct);
}
