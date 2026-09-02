using System.Text.Json;

using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared comparison-record search, paging, and write helpers for SQL and in-memory repositories.
/// </summary>
internal static class ComparisonRecordRepositoryCore
{
    public const int DefaultLimit = 50;
    public const int MaxLimit = 500;

    public static int ClampLimit(int limit) => limit <= 0 ? DefaultLimit : Math.Min(limit, MaxLimit);

    public static int ClampSkip(int skip) => skip < 0 ? 0 : skip;

    public static string ResolveOrderColumn(string? sortBy)
    {
        string v = (sortBy ?? "createdUtc").Trim().ToLowerInvariant();

        return v switch
        {
            "createdutc" or "created" => "CreatedUtc",
            "type" or "comparisontype" => "ComparisonType",
            "label" => "Label",
            "leftrunid" => "LeftRunId",
            "rightrunid" => "RightRunId",
            _ => "CreatedUtc",
        };
    }

    public static bool IsSortDescending(string? sortDir) =>
        !string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);

    public static void EnsureCursorPagingSupportsOrderColumn(string orderColumn)
    {
        if (!string.Equals(orderColumn, "CreatedUtc", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Cursor paging currently supports sortBy=createdUtc only.");
    }

    public static IEnumerable<ComparisonRecord> FilterInMemory(
        IEnumerable<ComparisonRecord> source,
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags)
    {
        ArgumentNullException.ThrowIfNull(source);

        IEnumerable<ComparisonRecord> query = source;

        if (!string.IsNullOrWhiteSpace(comparisonType))
            query = query.Where(r => string.Equals(r.ComparisonType, comparisonType, StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(leftRunId))
            query = query.Where(r => string.Equals(r.LeftRunId, leftRunId, StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(rightRunId))
            query = query.Where(r => string.Equals(r.RightRunId, rightRunId, StringComparison.Ordinal));

        if (createdFromUtc is not null)
            query = query.Where(r => r.CreatedUtc >= createdFromUtc.Value);

        if (createdToUtc is not null)
            query = query.Where(r => r.CreatedUtc <= createdToUtc.Value);

        if (!string.IsNullOrWhiteSpace(leftExportRecordId))
            query = query.Where(r => string.Equals(r.LeftExportRecordId, leftExportRecordId, StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(rightExportRecordId))
            query = query.Where(r => string.Equals(r.RightExportRecordId, rightExportRecordId, StringComparison.Ordinal));

        if (!string.IsNullOrWhiteSpace(label))
            query = query.Where(r => string.Equals(r.Label, label, StringComparison.Ordinal));

        if (tags is { Count: > 0 })
        {
            query = tags
                .Where(static t => !string.IsNullOrWhiteSpace(t))
                .Aggregate(
                    query,
                    static (current, needle) => current.Where(r =>
                        r.Tags.Any(x => string.Equals(x, needle, StringComparison.Ordinal))));
        }

        return query;
    }

    public static IEnumerable<ComparisonRecord> OrderInMemory(
        IEnumerable<ComparisonRecord> source,
        string? sortBy,
        string? sortDir)
    {
        ArgumentNullException.ThrowIfNull(source);

        string col = ResolveOrderColumn(sortBy);
        bool desc = IsSortDescending(sortDir);

        IOrderedEnumerable<ComparisonRecord> ordered = col.ToLowerInvariant() switch
        {
            "comparisontype" or "type" => desc
                ? source.OrderByDescending(static r => r.ComparisonType).ThenByDescending(static r => r.ComparisonRecordId)
                : source.OrderBy(static r => r.ComparisonType).ThenBy(static r => r.ComparisonRecordId),
            "label" => desc
                ? source.OrderByDescending(static r => r.Label).ThenByDescending(static r => r.ComparisonRecordId)
                : source.OrderBy(static r => r.Label).ThenBy(static r => r.ComparisonRecordId),
            "leftrunid" => desc
                ? source.OrderByDescending(static r => r.LeftRunId).ThenByDescending(static r => r.ComparisonRecordId)
                : source.OrderBy(static r => r.LeftRunId).ThenBy(static r => r.ComparisonRecordId),
            "rightrunid" => desc
                ? source.OrderByDescending(static r => r.RightRunId).ThenByDescending(static r => r.ComparisonRecordId)
                : source.OrderBy(static r => r.RightRunId).ThenBy(static r => r.ComparisonRecordId),
            _ => desc
                ? source.OrderByDescending(static r => r.CreatedUtc).ThenByDescending(static r => r.ComparisonRecordId)
                : source.OrderBy(static r => r.CreatedUtc).ThenBy(static r => r.ComparisonRecordId),
        };

        return ordered;
    }

    public static bool MatchesCursor(
        ComparisonRecord record,
        DateTime cursorCreatedUtc,
        string cursorComparisonRecordId,
        bool sortDescending)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentException.ThrowIfNullOrWhiteSpace(cursorComparisonRecordId);

        return sortDescending
            ? record.CreatedUtc < cursorCreatedUtc
              || (record.CreatedUtc == cursorCreatedUtc
                  && string.Compare(record.ComparisonRecordId, cursorComparisonRecordId, StringComparison.Ordinal) < 0)
            : record.CreatedUtc > cursorCreatedUtc
              || (record.CreatedUtc == cursorCreatedUtc
                  && string.Compare(record.ComparisonRecordId, cursorComparisonRecordId, StringComparison.Ordinal) > 0);
    }

    public static ComparisonRecord Clone(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new ComparisonRecord
        {
            ComparisonRecordId = record.ComparisonRecordId,
            ComparisonType = record.ComparisonType,
            LeftRunId = record.LeftRunId,
            RightRunId = record.RightRunId,
            LeftManifestVersion = record.LeftManifestVersion,
            RightManifestVersion = record.RightManifestVersion,
            LeftExportRecordId = record.LeftExportRecordId,
            RightExportRecordId = record.RightExportRecordId,
            Format = record.Format,
            SummaryMarkdown = record.SummaryMarkdown,
            PayloadJson = record.PayloadJson,
            Notes = record.Notes,
            CreatedUtc = record.CreatedUtc,
            Label = record.Label,
            Tags = [.. record.Tags],
        };
    }

    public static string? SerializeTagsForUpdate(IReadOnlyList<string>? tags) =>
        tags is null || tags.Count == 0 ? null : JsonSerializer.Serialize(tags);
}
