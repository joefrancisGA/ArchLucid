using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureDiagramReconciliationRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureDiagramReconciliationRepository
{
    public async Task UpsertAsync(ArchitectureDiagramReconciliationPersistRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.ArchitectureDiagramReconciliations AS target
            USING (SELECT @TenantId AS TenantId, @RunId AS RunId, @SnapshotId AS SnapshotId) AS source
            ON target.TenantId = source.TenantId
               AND target.RunId = source.RunId
               AND target.SnapshotId = source.SnapshotId
            WHEN MATCHED THEN
                UPDATE SET
                    ResultJson = @ResultJson,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    ReconciliationId,
                    TenantId,
                    RunId,
                    SnapshotId,
                    ResultJson,
                    CreatedUtc,
                    UpdatedUtc)
                VALUES (
                    @ReconciliationId,
                    @TenantId,
                    @RunId,
                    @SnapshotId,
                    @ResultJson,
                    @CreatedUtc,
                    @UpdatedUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<ArchitectureDiagramReconciliationPersistRecord?> TryGetByRunAndSnapshotAsync(
        Guid tenantId,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                ReconciliationId,
                TenantId,
                RunId,
                SnapshotId,
                ResultJson,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.ArchitectureDiagramReconciliations
            WHERE TenantId = @TenantId AND RunId = @RunId AND SnapshotId = @SnapshotId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureDiagramReconciliationPersistRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, RunId = runId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<Guid>> ListRunIdsBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT DISTINCT RunId
            FROM dbo.ArchitectureDiagramReconciliations
            WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
