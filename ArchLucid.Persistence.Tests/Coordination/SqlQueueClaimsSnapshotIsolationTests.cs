using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Tenancy;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Coordination;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlQueueClaimsSnapshotIsolationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Queue_claims_execute_in_a_catalog_with_read_committed_snapshot_enabled()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        CancellationToken ct = CancellationToken.None;
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(ct);
        bool snapshotEnabled = await connection.ExecuteScalarAsync<bool>(
            "SELECT is_read_committed_snapshot_on FROM sys.databases WHERE database_id = DB_ID();");
        snapshotEnabled.Should().BeTrue();

        await new DapperAuthorityPipelineWorkRepository(factory).DequeuePendingAsync(1, 60, ct);
        await new DapperRunExportBlobPushOutboxRepository(factory).DequeuePendingAsync(1, 60, ct);
        await new DapperPostCommitProjectionOutboxRepository(factory).DequeuePendingAsync(1, 60, ct);
        await new DapperRetrievalIndexingOutboxRepository(factory).DequeuePendingAsync(1, 60, ct);
        await new DapperCosmosGraphSnapshotOutboxRepository(factory).DequeuePendingAsync(1, 60, ct);

        int? standbyTableId = await connection.ExecuteScalarAsync<int?>(
            "SELECT OBJECT_ID(N'dbo.WarmTenantCatalogStandby', N'U');");
        standbyTableId.Should().NotBeNull();
        DedicatedSystemSqlConnectionFactory systemFactory = new(fixture.ConnectionString);
        await new DapperWarmTenantCatalogStandbyRepository(systemFactory).TryClaimOldestUnclaimedAsync(ct);
    }
}
