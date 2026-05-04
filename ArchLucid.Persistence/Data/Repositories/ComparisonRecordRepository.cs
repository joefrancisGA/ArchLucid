using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class ComparisonRecordRepository : IComparisonRecordRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ComparisonRecordRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
        ListStringTypeHandler.Register();
    }

    public async Task CreateAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(record.LeftRunId, nameof(record.LeftRunId));
        ComparisonRecordRunIdSql.ThrowIfNonEmptyButNotGuid(record.RightRunId, nameof(record.RightRunId));
        Guid? leftRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(record.LeftRunId);
        Guid? rightRun = ComparisonRecordRunIdSql.ToNullableSqlGuid(record.RightRunId);

        const string sql = """
                           INSERT INTO ComparisonRecords
                           (
                               ComparisonRecordId,
                               ComparisonType,
                               LeftRunId,
                               RightRunId,
                               LeftManifestVersion,
                               RightManifestVersion,
                               LeftExportRecordId,
                               RightExportRecordId,
                               Format,
                               SummaryMarkdown,
                               PayloadJson,
                               Notes,
                               CreatedUtc,
                               Label,
                               Tags
                           )
                           VALUES
                           (
                               @ComparisonRecordId,
                               @ComparisonType,
                               @LeftRunId,
                               @RightRunId,
                               @LeftManifestVersion,
                               @RightManifestVersion,
                               @LeftExportRecordId,
                               @RightExportRecordId,
                               @Format,
                               @SummaryMarkdown,
                               @PayloadJson,
                               @Notes,
                               @CreatedUtc,
                               @Label,
                               @Tags
                           );
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                record.ComparisonRecordId,
                record.ComparisonType,
                LeftRunId = leftRun,
                RightRunId = rightRun,
                record.LeftManifestVersion,
                record.RightManifestVersion,
                record.LeftExportRecordId,
                record.RightExportRecordId,
                record.Format,
                record.SummaryMarkdown,
                record.PayloadJson,
                record.Notes,
                record.CreatedUtc,
                record.Label,
                record.Tags
            },
            cancellationToken: cancellationToken));
    }

    public async Task<ComparisonRecord?> GetByIdAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        string sql = $"""
                      SELECT TOP 1
                          {ComparisonRecordRunIdSql.ProjectionRow}
                      FROM ComparisonRecords
                      WHERE ComparisonRecordId = @ComparisonRecordId;
                      """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ComparisonRecord? row = await connection.QuerySingleOrDefaultAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { ComparisonRecordId = comparisonRecordId },
            cancellationToken: cancellationToken));

        return NormalizeRunIdsNullable(row);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (!Guid.TryParse(runId, out Guid runGuid))
            return [];


        string sql = $"""
                      SELECT TOP 200
                          {ComparisonRecordRunIdSql.ProjectionRow}
                      FROM ComparisonRecords
                      WHERE LeftRunId = @RunId OR RightRunId = @RunId
                      ORDER BY CreatedUtc DESC;
                      """;

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { RunId = runGuid },
            cancellationToken: cancellationToken));

        return MaterializeNormalized(rows);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> GetByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = $"""
                      SELECT TOP 200
                          {ComparisonRecordRunIdSql.ProjectionRow}
                      FROM ComparisonRecords
                      WHERE LeftExportRecordId = @ExportRecordId OR RightExportRecordId = @ExportRecordId
                      ORDER BY CreatedUtc DESC;
                      """;

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { ExportRecordId = exportRecordId },
            cancellationToken: cancellationToken));

        return MaterializeNormalized(rows);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> SearchAsync(
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        string? sortBy,
        string? sortDir,
        int skip,
        int limit,
        CancellationToken cancellationToken = default)
    {
        // This query is intentionally generated at runtime because:
        // - filter predicates are optional
        // - tag matching is stored as JSON in an NVARCHAR column (OPENJSON)
        string baseSql = $"""
                           SELECT
                               {ComparisonRecordRunIdSql.ProjectionRow}
                           FROM ComparisonRecords
                           WHERE 1 = 1
                           """;

        List<string> conditions = [];
        DynamicParameters parameters = new();
        int safeLimit = limit <= 0 ? 50 : Math.Min(limit, 500);
        int safeSkip = skip < 0 ? 0 : skip;
        parameters.Add("@Limit", safeLimit);
        parameters.Add("@Skip", safeSkip);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType,
            leftRunId,
            rightRunId,
            createdFromUtc,
            createdToUtc,
            leftExportRecordId,
            rightExportRecordId,
            label,
            tags);

        string sql = baseSql;
        if (conditions.Count > 0)

            sql += " AND " + string.Join(" AND ", conditions);

        string orderColumn = ResolveOrderColumn(sortBy);
        bool sortDescending = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);
        // Ensure stable paging by always appending ComparisonRecordId as a tiebreaker.
        // Without this, records with identical CreatedUtc could reorder between pages.
        sql += sortDescending
            ? $" ORDER BY {orderColumn} DESC, ComparisonRecordId DESC"
            : $" ORDER BY {orderColumn} ASC, ComparisonRecordId ASC";
        sql += " OFFSET @Skip ROWS FETCH NEXT @Limit ROWS ONLY;";

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            parameters,
            cancellationToken: cancellationToken));

        return MaterializeNormalized(rows);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> SearchByCursorAsync(
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        string? sortBy,
        string? sortDir,
        DateTime? cursorCreatedUtc,
        string? cursorComparisonRecordId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        string baseSql = $"""
                           SELECT
                               {ComparisonRecordRunIdSql.ProjectionRow}
                           FROM ComparisonRecords
                           WHERE 1 = 1
                           """;

        List<string> conditions = [];
        DynamicParameters parameters = new();
        int safeLimit = limit <= 0 ? 50 : Math.Min(limit, 500);
        parameters.Add("@Limit", safeLimit);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType,
            leftRunId,
            rightRunId,
            createdFromUtc,
            createdToUtc,
            leftExportRecordId,
            rightExportRecordId,
            label,
            tags);

        string orderColumn = ResolveOrderColumn(sortBy);
        bool sortDescending = !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

        // Cursor paging: only supported for CreatedUtc ordering (plus ComparisonRecordId tiebreaker).
        if (!string.Equals(orderColumn, "CreatedUtc", StringComparison.OrdinalIgnoreCase))

            throw new InvalidOperationException("Cursor paging currently supports sortBy=createdUtc only.");


        if (cursorCreatedUtc is not null && !string.IsNullOrWhiteSpace(cursorComparisonRecordId))
        {
            parameters.Add("@CursorCreatedUtc", cursorCreatedUtc);
            parameters.Add("@CursorId", cursorComparisonRecordId);
            // For DESC: fetch items strictly "after" cursor in DESC order => older than cursor.
            // For ASC: fetch items strictly "after" cursor in ASC order => newer than cursor.
            conditions.Add(sortDescending
                ? "(CreatedUtc < @CursorCreatedUtc OR (CreatedUtc = @CursorCreatedUtc AND ComparisonRecordId < @CursorId))"
                : "(CreatedUtc > @CursorCreatedUtc OR (CreatedUtc = @CursorCreatedUtc AND ComparisonRecordId > @CursorId))");
        }

        string sql = baseSql;
        if (conditions.Count > 0)

            sql += " AND " + string.Join(" AND ", conditions);


        sql += sortDescending
            ? $" ORDER BY {orderColumn} DESC, ComparisonRecordId DESC"
            : $" ORDER BY {orderColumn} ASC, ComparisonRecordId ASC";

        sql += " OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY;";

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            parameters,
            cancellationToken: cancellationToken));

        return MaterializeNormalized(rows);
    }

    public async Task<bool> UpdateLabelAndTagsAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);

        const string sql = """
                           UPDATE ComparisonRecords
                           SET Label = @Label,
                               Tags = @Tags
                           WHERE ComparisonRecordId = @ComparisonRecordId;
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        string? tagsJson = tags is null || tags.Count == 0 ? null : JsonSerializer.Serialize(tags);
        int rows = await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                ComparisonRecordId = comparisonRecordId,
                Label = label ?? (object)DBNull.Value,
                Tags = tagsJson ?? (object)DBNull.Value
            },
            cancellationToken: cancellationToken));
        return rows > 0;
    }

    private static ComparisonRecord? NormalizeRunIdsNullable(ComparisonRecord? record)
    {
        if (record is not null)
            ComparisonRecordRunIdSql.NormalizeRunIdsForRead(record);

        return record;
    }

    private static List<ComparisonRecord> MaterializeNormalized(IEnumerable<ComparisonRecord> rows)
    {
        List<ComparisonRecord> list = rows.ToList();

        foreach (ComparisonRecord r in list)
            ComparisonRecordRunIdSql.NormalizeRunIdsForRead(r);

        return list;
    }

    private static string ResolveOrderColumn(string? sortBy)
    {
        string v = (sortBy ?? "createdUtc").Trim().ToLowerInvariant();
        return v switch
        {
            "createdutc" => "CreatedUtc",
            "created" => "CreatedUtc",
            "type" => "ComparisonType",
            "comparisontype" => "ComparisonType",
            "label" => "Label",
            "leftrunid" => "LeftRunId",
            "rightrunid" => "RightRunId",
            _ => "CreatedUtc"
        };
    }
}
