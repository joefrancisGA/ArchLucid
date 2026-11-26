using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperGovernanceApprovalRequestRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : GovernanceApprovalRequestRepositoryContractTests, IAsyncLifetime
{
    private SqlServerDisposablePersistenceFixture? _globalQueryCatalog;

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _globalQueryCatalog?.DisposeAsync() ?? Task.CompletedTask;

    protected override async Task<IGovernanceApprovalRequestRepository> CreateGlobalQueryRepositoryAsync()
    {
        _globalQueryCatalog = new SqlServerDisposablePersistenceFixture();
        await _globalQueryCatalog.InitializeAsync();
        return CreateRepository(_globalQueryCatalog.ConnectionString);
    }

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IGovernanceApprovalRequestRepository CreateRepository() => CreateRepository(fixture.ConnectionString);

    private static IGovernanceApprovalRequestRepository CreateRepository(string connectionString) =>
        new TenantPrimingGovernanceApprovalRequestRepository(
            connectionString,
            new FixedTestScopeContextProvider(GovernanceRepositoryContractScope.AsScopeContext()));
}
