using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Scoping;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="ConversationThreadRepositoryContractTests" /> against
///     <see cref="DapperConversationThreadRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperConversationThreadRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : ConversationThreadRepositoryContractTests
{
    protected override bool IncludeArchiveContractTest => false;

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IConversationThreadRepository CreateRepository()
    {
        return new DapperConversationThreadRepository(
            new TestSqlConnectionFactory(fixture.ConnectionString),
            new EmptyPersistenceScopeContextProvider());
    }
}
