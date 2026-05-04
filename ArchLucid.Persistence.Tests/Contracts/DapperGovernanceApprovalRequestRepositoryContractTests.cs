using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperGovernanceApprovalRequestRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : GovernanceApprovalRequestRepositoryContractTests,
        IAsyncLifetime
{
    // GovernanceApprovalRequests FK to dbo.Tenants; re-prime once per instance (per test method) inside this collection.
    public async Task InitializeAsync()
    {
        if (!fixture.IsSqlServerAvailable)
            return;

        await SqlServerPersistenceFixture.PrimeGovernanceContractTenantAsync(fixture.ConnectionString);
    }

    public Task DisposeAsync() =>
        Task.CompletedTask;

    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override IGovernanceApprovalRequestRepository CreateRepository()
    {
        return new GovernanceApprovalRequestRepository(
            new TestSqlDbConnectionFactory(fixture.ConnectionString),
            new FixedTestScopeContextProvider(GovernanceRepositoryContractScope.AsScopeContext()));
    }
}
