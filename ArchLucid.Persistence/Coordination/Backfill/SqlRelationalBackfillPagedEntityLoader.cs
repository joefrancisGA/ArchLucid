using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Keyset-paged header row loads for backfill stages (TB-085).</summary>
[ExcludeFromCodeCoverage(Justification =
    "SQL-dependent paging queries; covered by SqlRelationalBackfillServiceSqlIntegrationTests.")]
public static class SqlRelationalBackfillPagedEntityLoader
{
    public static async Task<IReadOnlyList<SqlRelationalBackfillGuidPageRow>> LoadGuidPageAsync(
        ISqlConnectionFactory connectionFactory,
        string tableName,
        string idColumnName,
        SqlRelationalBackfillCursor cursor,
        int batchSize,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tableName);
        ArgumentException.ThrowIfNullOrWhiteSpace(idColumnName);

        if (batchSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be positive.");

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        // Table/column names are fixed literals from SqlRelationalBackfillService — not user input.
        string sql = $"""
                      SELECT TOP (@BatchSize)
                          {idColumnName} AS EntityId,
                          CreatedUtc
                      FROM {tableName}
                      WHERE (CreatedUtc > @CursorCreatedUtc)
                         OR (CreatedUtc = @CursorCreatedUtc AND {idColumnName} > @CursorEntityId)
                      ORDER BY CreatedUtc, {idColumnName};
                      """;

        List<SqlRelationalBackfillGuidPageRow> rows = (await connection.QueryAsync<SqlRelationalBackfillGuidPageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    BatchSize = batchSize,
                    CursorCreatedUtc = cursor.LastProcessedCreatedUtc,
                    CursorEntityId = cursor.LastProcessedEntityId,
                },
                cancellationToken: ct))).ToList();

        return rows;
    }

    public static async Task<IReadOnlyList<SqlRelationalBackfillGoldenManifestPageRow>> LoadGoldenManifestPageAsync(
        ISqlConnectionFactory connectionFactory,
        SqlRelationalBackfillCursor cursor,
        int batchSize,
        CancellationToken ct)
    {
        if (batchSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be positive.");

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        List<SqlRelationalBackfillGoldenManifestPageRow> rows =
            (await connection.QueryAsync<SqlRelationalBackfillGoldenManifestPageRow>(
                new CommandDefinition(
                    """
                    SELECT TOP (@BatchSize)
                        ManifestId,
                        TenantId,
                        WorkspaceId,
                        ProjectId,
                        CreatedUtc
                    FROM dbo.GoldenManifests
                    WHERE (CreatedUtc > @CursorCreatedUtc)
                       OR (CreatedUtc = @CursorCreatedUtc AND ManifestId > @CursorEntityId)
                    ORDER BY CreatedUtc, ManifestId;
                    """,
                    new
                    {
                        BatchSize = batchSize,
                        CursorCreatedUtc = cursor.LastProcessedCreatedUtc,
                        CursorEntityId = cursor.LastProcessedEntityId,
                    },
                    cancellationToken: ct))).ToList();

        return rows;
    }
}

[ExcludeFromCodeCoverage(Justification = "Backfill page row DTO; no logic.")]
public sealed record SqlRelationalBackfillGuidPageRow(Guid EntityId, DateTime CreatedUtc);

[ExcludeFromCodeCoverage(Justification = "Backfill page row DTO; no logic.")]
public sealed record SqlRelationalBackfillGoldenManifestPageRow(
    Guid ManifestId,
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    DateTime CreatedUtc);
