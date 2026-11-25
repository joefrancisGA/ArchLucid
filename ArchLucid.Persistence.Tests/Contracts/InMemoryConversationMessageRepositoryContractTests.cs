using ArchLucid.Core.Conversation;
using ArchLucid.Persistence.Conversation;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="ConversationMessageRepositoryContractTests" /> against
///     <see cref="InMemoryConversationMessageRepository" />.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryConversationMessageRepositoryContractTests : ConversationMessageRepositoryContractTests
{
    private readonly InMemoryConversationThreadRepository _threads = new();

    protected override IConversationMessageRepository CreateRepository()
    {
        return new InMemoryConversationMessageRepository(_threads);
    }

    protected override Task EnsureThreadExistsAsync(ConversationThread thread) =>
        _threads.CreateAsync(thread, CancellationToken.None);
}
