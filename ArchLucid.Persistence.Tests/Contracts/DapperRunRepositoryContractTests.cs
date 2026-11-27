using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="RunRepositoryContractTests" /> against <see cref="SqlRunRepository" />.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperRunRepositoryContractTests(SqlServerPersistenceFixture fixture) : RunRepositoryContractTests, IAsyncLifetime
{
    private readonly SqlServerDisposablePersistenceFixture _archiveCatalog = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _archiveCatalog.DisposeAsync();

    protected override async Task<IRunRepository> CreateArchiveRepositoryAsync()
    {
        await _archiveCatalog.InitializeAsync();
        return CreateRepository(_archiveCatalog.ConnectionString);
    }

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IRunRepository CreateRepository() => CreateRepository(fixture.ConnectionString);

    private static IRunRepository CreateRepository(string connectionString)
    {
        TestSqlConnectionFactory sqlFactory = new(connectionString);
        TestAuthorityRunListConnectionFactory listFactory = new(sqlFactory);

        return SqlRunRepositoryTestFactory.Create(sqlFactory, listFactory);
    }
}
