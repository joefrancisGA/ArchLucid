using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlInfrastructureDiagramNodeMappingRepository(ISqlConnectionFactory connectionFactory)
    : IInfrastructureDiagramNodeMappingRepository
{
    public async Task UpsertAsync(InfrastructureDiagramNodeMappingPersistRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.InfrastructureDiagramNodeMappings AS target
            USING (
                SELECT
                    @TenantId AS TenantId,
                    @SnapshotId AS SnapshotId,
                    @NormalizedDiagramLabel AS NormalizedDiagramLabel,
                    @DiagramNodeId AS DiagramNodeId) AS source
            ON target.TenantId = source.TenantId
               AND target.SnapshotId = source.SnapshotId
               AND target.NormalizedDiagramLabel = source.NormalizedDiagramLabel
               AND (
                    (target.DiagramNodeId IS NULL AND source.DiagramNodeId IS NULL)
                    OR target.DiagramNodeId = source.DiagramNodeId)
            WHEN MATCHED THEN
                UPDATE SET
                    CloudResourceId = @CloudResourceId,
                    AzureResourceId = @AzureResourceId,
                    SavedByUserOid = @SavedByUserOid,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    MappingId,
                    TenantId,
                    SnapshotId,
                    NormalizedDiagramLabel,
                    DiagramNodeId,
                    CloudResourceId,
                    AzureResourceId,
                    SavedByUserOid,
                    CreatedUtc,
                    UpdatedUtc)
                VALUES (
                    @MappingId,
                    @TenantId,
                    @SnapshotId,
                    @NormalizedDiagramLabel,
                    @DiagramNodeId,
                    @CloudResourceId,
                    @AzureResourceId,
                    @SavedByUserOid,
                    @CreatedUtc,
                    @UpdatedUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                MappingId,
                TenantId,
                SnapshotId,
                NormalizedDiagramLabel,
                DiagramNodeId,
                CloudResourceId,
                AzureResourceId,
                SavedByUserOid,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.InfrastructureDiagramNodeMappings
            WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InfrastructureDiagramNodeMappingPersistRecord> rows =
            await connection.QueryAsync<InfrastructureDiagramNodeMappingPersistRecord>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, SnapshotId = snapshotId },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
