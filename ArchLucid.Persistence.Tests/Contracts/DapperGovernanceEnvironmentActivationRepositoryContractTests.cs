using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperGovernanceEnvironmentActivationRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : GovernanceEnvironmentActivationRepositoryContractTests,
        IAsyncLifetime
{
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

    protected override IGovernanceEnvironmentActivationRepository CreateRepository()
    {
        return new GovernanceEnvironmentActivationRepository(
            new TestSqlDbConnectionFactory(fixture.ConnectionString),
            new FixedTestScopeContextProvider(GovernanceRepositoryContractScope.AsScopeContext()));
    }
}
