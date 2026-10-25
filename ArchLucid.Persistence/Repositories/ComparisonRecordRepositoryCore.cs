using System.Text.Json;

using ArchLucid.Contracts.Metadata;

using ArchLucid.Persistence.Data.Repositories;

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
        {
            string normalizedComparisonType = comparisonType.Trim();
            query = query.Where(r =>
                !string.IsNullOrWhiteSpace(r.ComparisonType)
                && string.Equals(
                    r.ComparisonType.Trim(),
                    normalizedComparisonType,
                    StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(leftRunId))
        {
            string? normalizedLeftRunId = ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull(leftRunId);
            if (normalizedLeftRunId is not null)
            {
                query = query.Where(r =>
                    ComparisonRecordRunIdSql.StoredRunIdMatchesLookup(r.LeftRunId, normalizedLeftRunId));
            }
        }

        if (!string.IsNullOrWhiteSpace(rightRunId))
        {
            string? normalizedRightRunId = ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull(rightRunId);
            if (normalizedRightRunId is not null)
            {
                query = query.Where(r =>
                    ComparisonRecordRunIdSql.StoredRunIdMatchesLookup(r.RightRunId, normalizedRightRunId));
            }
        }

        if (createdFromUtc is not null)
            query = query.Where(r => r.CreatedUtc >= createdFromUtc.Value);

        if (createdToUtc is not null)
            query = query.Where(r => r.CreatedUtc <= createdToUtc.Value);

        if (!string.IsNullOrWhiteSpace(leftExportRecordId))
        {
            string normalizedLeftExportRecordId =
                ComparisonExportRecordIdLookup.NormalizeLookupKey(leftExportRecordId);
            query = query.Where(r =>
                ComparisonExportRecordIdLookup.StoredValueMatchesLookup(
                    r.LeftExportRecordId,
                    normalizedLeftExportRecordId));
        }

        if (!string.IsNullOrWhiteSpace(rightExportRecordId))
        {
            string normalizedRightExportRecordId =
                ComparisonExportRecordIdLookup.NormalizeLookupKey(rightExportRecordId);
            query = query.Where(r =>
                ComparisonExportRecordIdLookup.StoredValueMatchesLookup(
                    r.RightExportRecordId,
                    normalizedRightExportRecordId));
        }

        if (!string.IsNullOrWhiteSpace(label))
        {
            string normalizedLabel = label.Trim();
            query = query.Where(r =>
                !string.IsNullOrWhiteSpace(r.Label)
                && string.Equals(
                    r.Label.Trim(),
                    normalizedLabel,
                    StringComparison.OrdinalIgnoreCase));
        }

        if (tags is { Count: > 0 })
        {
            query = tags
                .Where(static t => !string.IsNullOrWhiteSpace(t))
                .Select(static t => t.Trim())
                .Aggregate(
                    query,
                    static (current, needle) => current.Where(r =>
                        r.Tags.Any(x =>
                            !string.IsNullOrWhiteSpace(x)
                            && string.Equals(
                                x.Trim(),
                                needle,
                                StringComparison.OrdinalIgnoreCase))));
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
                ? source.OrderByDescending(static r => r.ComparisonType)
                    .ThenByDescending(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId))
                : source.OrderBy(static r => r.ComparisonType)
                    .ThenBy(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId)),
            "label" => desc
                ? source.OrderByDescending(static r => r.Label)
                    .ThenByDescending(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId))
                : source.OrderBy(static r => r.Label)
                    .ThenBy(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId)),
            "leftrunid" => desc
                ? source.OrderByDescending(static r => r.LeftRunId)
                    .ThenByDescending(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId))
                : source.OrderBy(static r => r.LeftRunId)
                    .ThenBy(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId)),
            "rightrunid" => desc
                ? source.OrderByDescending(static r => r.RightRunId)
                    .ThenByDescending(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId))
                : source.OrderBy(static r => r.RightRunId)
                    .ThenBy(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId)),
            _ => desc
                ? source.OrderByDescending(static r => r.CreatedUtc)
                    .ThenByDescending(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId))
                : source.OrderBy(static r => r.CreatedUtc)
                    .ThenBy(static r => ComparisonRecordIdLookup.TiebreakerSortKey(r.ComparisonRecordId)),
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

        string normalizedCursorComparisonRecordId = cursorComparisonRecordId.Trim();
        string normalizedRecordComparisonRecordId = record.ComparisonRecordId.Trim();

        return sortDescending
            ? record.CreatedUtc < cursorCreatedUtc
              || (record.CreatedUtc == cursorCreatedUtc
                  && string.Compare(
                      normalizedRecordComparisonRecordId,
                      normalizedCursorComparisonRecordId,
                      StringComparison.OrdinalIgnoreCase) < 0)
            : record.CreatedUtc > cursorCreatedUtc
              || (record.CreatedUtc == cursorCreatedUtc
                  && string.Compare(
                      normalizedRecordComparisonRecordId,
                      normalizedCursorComparisonRecordId,
                      StringComparison.OrdinalIgnoreCase) > 0);
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

    internal static (string? Label, IReadOnlyList<string>? Tags) NormalizeLabelAndTagsForUpdate(
        string? label,
        IReadOnlyList<string>? tags)
    {
        string? normalizedLabel = label is null
            ? null
            : OptionalExportMetadataStringNormalizer.NormalizeOptionalString(label);

        if (tags is null)
            return (normalizedLabel, null);

        List<string> normalizedTags = [];
        foreach (string tag in tags)
        {
            string? normalizedTag = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(tag);
            if (normalizedTag is not null)
                normalizedTags.Add(normalizedTag);
        }

        return (normalizedLabel, normalizedTags);
    }
}
