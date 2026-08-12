using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Reads one keyset page of finding metadata (TB-929). Fetches <c>take + 1</c> rows so the caller learns whether a
///     further page exists without a second count query.
/// </summary>
internal static class FindingRecordKeysetPageReader
{
    public static async Task<FindingRecordMetadataPage> ReadAsync(
        IDbConnection connection,
        ScopeContext scope,
        FindingRecordKeysetPageRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        int cappedTake = ClampTake(request.Take);
        string sql = FindingRecordKeysetListSql.BuildKeysetPage(scope, request.OrderByPriority);
        DynamicParameters parameters = BuildParameters(scope, request, cappedTake + 1);

        List<FindingRecordMetadataSqlRow> rows = (
            await connection.QueryAsync<FindingRecordMetadataSqlRow>(
                new CommandDefinition(sql, parameters, cancellationToken: ct))).ToList();

        bool hasMore = rows.Count > cappedTake;

        if (hasMore)
            rows.RemoveAt(rows.Count - 1);

        return new FindingRecordMetadataPage(rows.ConvertAll(MapRow).ToArray(), hasMore);
    }

    private static int ClampTake(int take) =>
        Math.Clamp(take <= 0 ? FindingPagination.DefaultTake : take, 1, FindingPagination.MaxTake);

    private static DynamicParameters BuildParameters(
        ScopeContext scope,
        FindingRecordKeysetPageRequest request,
        int fetchLimit)
    {
        DynamicParameters parameters = new();
        parameters.Add("FsId", request.FindingsSnapshotId);
        parameters.Add("Severity", OptionalEqualityFilter(request.Severity));
        parameters.Add("Category", OptionalEqualityFilter(request.Category));
        parameters.Add("FindingType", OptionalEqualityFilter(request.FindingType));
        parameters.Add("HasCursor", request.HasCursor ? 1 : 0);
        parameters.Add("CurPr", request.CursorPriorityRank);
        parameters.Add("CurSo", request.CursorSortOrder ?? 0);
        parameters.Add("CurFrid", request.CursorFindingRecordId ?? Guid.Empty);
        parameters.Add("Limit", fetchLimit);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);
        return parameters;
    }

    /// <summary>Blank filter values mean "no filter", which the SQL expresses as a <c>NULL</c> parameter.</summary>
    private static string? OptionalEqualityFilter(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static FindingRecordMetadataRow MapRow(FindingRecordMetadataSqlRow row) =>
        new(
            row.FindingRecordId,
            row.SortOrder,
            row.FindingId,
            row.FindingType,
            row.Category,
            row.EngineType,
            row.Severity,
            row.Title,
            row.PriorityRank);
}
