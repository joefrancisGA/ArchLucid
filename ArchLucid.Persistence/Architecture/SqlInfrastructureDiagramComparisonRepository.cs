using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlInfrastructureDiagramComparisonRepository(ISqlConnectionFactory connectionFactory)
    : IInfrastructureDiagramComparisonRepository
{
    public async Task UpsertAsync(InfrastructureDiagramComparisonPersistRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.InfrastructureDiagramComparisons AS target
            USING (SELECT @ComparisonId AS ComparisonId) AS source
            ON target.ComparisonId = source.ComparisonId AND target.TenantId = @TenantId
            WHEN MATCHED THEN
                UPDATE SET
                    SnapshotId = @SnapshotId,
                    SourcesJson = @SourcesJson,
                    ResultJson = @ResultJson,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    ComparisonId,
                    TenantId,
                    SnapshotId,
                    SourcesJson,
                    ResultJson,
                    CreatedUtc,
                    UpdatedUtc)
                VALUES (
                    @ComparisonId,
                    @TenantId,
                    @SnapshotId,
                    @SourcesJson,
                    @ResultJson,
                    @CreatedUtc,
                    @UpdatedUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<InfrastructureDiagramComparisonPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid comparisonId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                ComparisonId,
                TenantId,
                SnapshotId,
                SourcesJson,
                ResultJson,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.InfrastructureDiagramComparisons
            WHERE TenantId = @TenantId AND ComparisonId = @ComparisonId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<InfrastructureDiagramComparisonPersistRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ComparisonId = comparisonId },
                cancellationToken: cancellationToken));
    }
}
