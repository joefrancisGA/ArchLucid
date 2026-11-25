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
    public async Task Blob_export_claim_preserves_new_requester_binding_and_skips_legacy_rows()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        CancellationToken ct = CancellationToken.None;
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperRunExportBlobPushOutboxRepository repository = new(factory);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(ct);
        Guid legacyId = Guid.NewGuid();
        Guid legacyRun = Guid.NewGuid();
        Guid newRun = Guid.NewGuid();
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        Guid requesterId = Guid.NewGuid();
        string actorKey = $"jwt:{Guid.NewGuid():D}";
        const string destination = "https://acct.blob.core.windows.net/c/b?sas=fixture";

        try
        {
            await connection.ExecuteAsync("""
                INSERT INTO dbo.RunExportBlobPushOutbox
                    (OutboxId, RunId, TenantId, WorkspaceId, ProjectId, DestinationSasUrl, CreatedUtc)
                VALUES (@legacyId, @legacyRun, @tenant, @workspace, @project, @destination,
                        DATEADD(DAY, -1, SYSUTCDATETIME()));
                """, new { legacyId, legacyRun, tenant, workspace, project, destination });
            await repository.EnqueueAsync(newRun, tenant, workspace, project, destination, actorKey, requesterId, ct);

            IReadOnlyList<RunExportBlobPushOutboxEntry> claims = await repository.DequeuePendingAsync(100, 60, ct);
            RunExportBlobPushOutboxEntry claim = claims.Should().ContainSingle(row => row.RunId == newRun).Subject;
            claim.RequestedByActorKey.Should().Be(actorKey);
            claim.RequestedByDirectoryUserId.Should().Be(requesterId);
            claims.Should().NotContain(row => row.RunId == legacyRun);
            bool legacyUnchanged = await connection.ExecuteScalarAsync<bool>("""
                SELECT CONVERT(bit, CASE WHEN LockedUntilUtc IS NULL AND ProcessedUtc IS NULL
                    AND DeadLetteredUtc IS NULL AND AttemptCount = 0 THEN 1 ELSE 0 END)
                FROM dbo.RunExportBlobPushOutbox WHERE OutboxId = @legacyId;
                """, new { legacyId });
            legacyUnchanged.Should().BeTrue();
        }
        finally
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.RunExportBlobPushOutbox WHERE OutboxId = @legacyId OR RunId = @newRun;",
                new { legacyId, newRun });
        }
    }

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
