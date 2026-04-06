using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperCoordinatorDecisionTraceRepositoryContractTests(SqlServerPersistenceFixture fixture)
    : CoordinatorDecisionTraceRepositoryContractTests
{
    protected override void SkipIfSqlServerUnavailable()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    }

    protected override ICoordinatorDecisionTraceRepository CreateRepository()
    {
        return new DecisionTraceRepository(new TestSqlDbConnectionFactory(fixture.ConnectionString));
    }

    protected override async Task PrepareRunForCoordinatorDataAsync(string requestId, string runId, CancellationToken ct)
    {
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(ct);
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId, ct);
    }
}
