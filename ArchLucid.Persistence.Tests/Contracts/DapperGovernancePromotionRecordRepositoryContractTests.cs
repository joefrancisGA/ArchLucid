using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperGovernancePromotionRecordRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : GovernancePromotionRecordRepositoryContractTests,
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

    protected override IGovernancePromotionRecordRepository CreateRepository()
    {
        return new GovernancePromotionRecordRepository(
            new TestSqlDbConnectionFactory(fixture.ConnectionString),
            new FixedTestScopeContextProvider(GovernanceRepositoryContractScope.AsScopeContext()));
    }
}
