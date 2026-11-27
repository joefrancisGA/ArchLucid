using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Persistence.Tests.IntegrationOutbox;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class AzureDevOpsThreadCreateClaimSqlTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Sql_claims_are_single_winner_across_connections_and_survive_a_new_store()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        DapperAzureDevOpsThreadCreateClaimStore first = new(new SqlConnectionFactory(fixture.ConnectionString));
        DapperAzureDevOpsThreadCreateClaimStore restarted = new(new SqlConnectionFactory(fixture.ConnectionString));

        await AzureDevOpsThreadClaimStoreContract.VerifyAsync(first, restarted);
    }
}
