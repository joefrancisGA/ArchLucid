using ArchLucid.Core.Conversation;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Scoping;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="ConversationMessageRepositoryContractTests" /> against
///     <see cref="DapperConversationMessageRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperConversationMessageRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : ConversationMessageRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IConversationMessageRepository CreateRepository()
    {
        return new DapperConversationMessageRepository(
            new TestSqlConnectionFactory(fixture.ConnectionString),
            new EmptyPersistenceScopeContextProvider());
    }

    protected override async Task EnsureThreadExistsAsync(ConversationThread thread)
    {
        DapperConversationThreadRepository threads =
            new(new TestSqlConnectionFactory(fixture.ConnectionString), new EmptyPersistenceScopeContextProvider());

        await threads.CreateAsync(thread, CancellationToken.None);
    }
}
