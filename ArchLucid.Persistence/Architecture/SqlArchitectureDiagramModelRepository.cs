using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureDiagramModelRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureDiagramModelRepository
{
    public async Task UpsertAsync(ArchitectureDiagramModelPersistRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.ArchitectureDiagramModels AS target
            USING (SELECT @TenantId AS TenantId, @RunId AS RunId) AS source
            ON target.TenantId = source.TenantId AND target.RunId = source.RunId
            WHEN MATCHED THEN
                UPDATE SET
                    ModelJson = @ModelJson,
                    ExtractionMethod = @ExtractionMethod,
                    WarningsJson = @WarningsJson,
                    UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    DiagramModelId,
                    TenantId,
                    RunId,
                    ModelJson,
                    ExtractionMethod,
                    WarningsJson,
                    CreatedUtc,
                    UpdatedUtc)
                VALUES (
                    @DiagramModelId,
                    @TenantId,
                    @RunId,
                    @ModelJson,
                    @ExtractionMethod,
                    @WarningsJson,
                    @CreatedUtc,
                    @UpdatedUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<ArchitectureDiagramModelPersistRecord?> TryGetByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                DiagramModelId,
                TenantId,
                RunId,
                ModelJson,
                ExtractionMethod,
                WarningsJson,
                CreatedUtc,
                UpdatedUtc
            FROM dbo.ArchitectureDiagramModels
            WHERE TenantId = @TenantId AND RunId = @RunId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureDiagramModelPersistRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, RunId = runId },
                cancellationToken: cancellationToken));
    }
}
