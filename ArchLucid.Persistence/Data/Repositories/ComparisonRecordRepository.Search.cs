// stryker disable all
using System.Data;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class ComparisonRecordRepository
{
    public async Task<ComparisonRecord?> GetByIdAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);
        string normalizedComparisonRecordId = ComparisonRecordIdLookup.NormalizeLookupKey(comparisonRecordId);

        string sql = $"""
                      SELECT TOP 1
                          {ComparisonRecordRunIdSql.ProjectionRow}
                      FROM ComparisonRecords
                      WHERE LOWER({ComparisonRecordIdSql.TrimmedColumnExpression}) = LOWER(@ComparisonRecordId);
                      """;

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ComparisonRecord? row = await connection.QuerySingleOrDefaultAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { ComparisonRecordId = normalizedComparisonRecordId },
            cancellationToken: cancellationToken));

        return NormalizeRunIdsNullable(row);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Guid? runGuid = ComparisonRecordRunIdSql.ToNullableSqlGuid(runId);
        if (runGuid is null)
            return [];

        string sql = $"""
                      SELECT TOP 200
                          {ComparisonRecordListSql.SelectColumnsWithoutPayloadJson}
                      FROM ComparisonRecords
                      WHERE LeftRunId = @RunId OR RightRunId = @RunId
                      ORDER BY CreatedUtc DESC;
                      """;

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { RunId = runGuid.Value },
            cancellationToken: cancellationToken));

        return ComparisonRecordListProjection.MaterializeWithoutPayloadJson(rows);
    }

    public async Task<IReadOnlyList<ComparisonRecord>> GetByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken cancellationToken = default)
    {
        string normalizedExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);
        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = $"""
                      SELECT TOP 200
                          {ComparisonRecordListSql.SelectColumnsWithoutPayloadJson}
                      FROM ComparisonRecords
                      WHERE LOWER(LTRIM(RTRIM(LeftExportRecordId))) = LOWER(@ExportRecordId)
                         OR LOWER(LTRIM(RTRIM(RightExportRecordId))) = LOWER(@ExportRecordId)
                      ORDER BY CreatedUtc DESC;
                      """;

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            new { ExportRecordId = normalizedExportRecordId },
            cancellationToken: cancellationToken));

        return ComparisonRecordListProjection.MaterializeWithoutPayloadJson(rows);
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
                              {ComparisonRecordListSql.SelectColumnsWithoutPayloadJson}
                          FROM ComparisonRecords
                          WHERE 1 = 1
                          """;

        List<string> conditions = [];
        DynamicParameters parameters = new();
        int safeLimit = ComparisonRecordRepositoryCore.ClampLimit(limit);
        int safeSkip = ComparisonRecordRepositoryCore.ClampSkip(skip);
        parameters.Add("@Limit", safeLimit);
        parameters.Add("@Skip", safeSkip);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);
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

        string orderColumn = ComparisonRecordRepositoryCore.ResolveOrderColumn(sortBy);
        bool sortDescending = ComparisonRecordRepositoryCore.IsSortDescending(sortDir);
        // Ensure stable paging by always appending ComparisonRecordId as a tiebreaker.
        // Without this, records with identical CreatedUtc could reorder between pages.
        sql += sortDescending
            ? $" ORDER BY {orderColumn} DESC, {ComparisonRecordIdSql.TrimmedColumnExpression} DESC"
            : $" ORDER BY {orderColumn} ASC, {ComparisonRecordIdSql.TrimmedColumnExpression} ASC";
        sql += " OFFSET @Skip ROWS FETCH NEXT @Limit ROWS ONLY;";

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            parameters,
            cancellationToken: cancellationToken));

        return ComparisonRecordListProjection.MaterializeWithoutPayloadJson(rows);
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
                              {ComparisonRecordListSql.SelectColumnsWithoutPayloadJson}
                          FROM ComparisonRecords
                          WHERE 1 = 1
                          """;

        List<string> conditions = [];
        DynamicParameters parameters = new();
        int safeLimit = ComparisonRecordRepositoryCore.ClampLimit(limit);
        parameters.Add("@Limit", safeLimit);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);
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

        string orderColumn = ComparisonRecordRepositoryCore.ResolveOrderColumn(sortBy);
        bool sortDescending = ComparisonRecordRepositoryCore.IsSortDescending(sortDir);

        // Cursor paging: only supported for CreatedUtc ordering (plus ComparisonRecordId tiebreaker).

        ComparisonRecordRepositoryCore.EnsureCursorPagingSupportsOrderColumn(orderColumn);

        if (cursorCreatedUtc is not null && !string.IsNullOrWhiteSpace(cursorComparisonRecordId))
        {
            parameters.Add("@CursorCreatedUtc", cursorCreatedUtc);
            parameters.Add(
                "@CursorId",
                ComparisonRecordIdLookup.NormalizeLookupKey(cursorComparisonRecordId));
            string trimmedComparisonRecordId = $"LOWER({ComparisonRecordIdSql.TrimmedColumnExpression})";
            // For DESC: fetch items strictly "after" cursor in DESC order => older than cursor.
            // For ASC: fetch items strictly "after" cursor in ASC order => newer than cursor.
            conditions.Add(sortDescending
                ? $"(CreatedUtc < @CursorCreatedUtc OR (CreatedUtc = @CursorCreatedUtc AND {trimmedComparisonRecordId} < LOWER(@CursorId)))"
                : $"(CreatedUtc > @CursorCreatedUtc OR (CreatedUtc = @CursorCreatedUtc AND {trimmedComparisonRecordId} > LOWER(@CursorId)))");
        }

        string sql = baseSql;

        if (conditions.Count > 0)
            sql += " AND " + string.Join(" AND ", conditions);

        sql += sortDescending
            ? $" ORDER BY {orderColumn} DESC, {ComparisonRecordIdSql.TrimmedColumnExpression} DESC"
            : $" ORDER BY {orderColumn} ASC, {ComparisonRecordIdSql.TrimmedColumnExpression} ASC";

        sql += " OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY;";

        IEnumerable<ComparisonRecord> rows = await connection.QueryAsync<ComparisonRecord>(new CommandDefinition(
            sql,
            parameters,
            cancellationToken: cancellationToken));

        return ComparisonRecordListProjection.MaterializeWithoutPayloadJson(rows);
    }

    private static ComparisonRecord? NormalizeRunIdsNullable(ComparisonRecord? record)
    {
        if (record is not null)
            ComparisonRecordPersistNormalizer.NormalizeForPersist(record);

        return record;
    }

}
