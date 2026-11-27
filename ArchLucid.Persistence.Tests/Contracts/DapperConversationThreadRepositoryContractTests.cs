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
    : ConversationThreadRepositoryContractTests, IAsyncLifetime
{
    private readonly SqlServerDisposablePersistenceFixture _archiveCatalog = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _archiveCatalog.DisposeAsync();

    protected override async Task<IConversationThreadRepository> CreateArchiveRepositoryAsync()
    {
        await _archiveCatalog.InitializeAsync();
        return CreateRepository(_archiveCatalog.ConnectionString);
    }

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IConversationThreadRepository CreateRepository() => CreateRepository(fixture.ConnectionString);

    private static IConversationThreadRepository CreateRepository(string connectionString)
    {
        return new DapperConversationThreadRepository(
            new TestSqlConnectionFactory(connectionString),
            new EmptyPersistenceScopeContextProvider());
    }
}
