using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests.Governance.Posture;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ArchitecturePosturePillarCatalogSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Migration_320_seeds_seven_pillar_catalog_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        int count = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM dbo.PillarCatalog WHERE IsReviewIntegrityAxis = 0;");

        count.Should().Be(7);
    }
}
