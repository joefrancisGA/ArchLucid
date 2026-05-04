using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Maps optional API/contract run id strings to SQL <c>UNIQUEIDENTIFIER</c> parameters.</summary>
internal static class ComparisonRecordRunIdSql
{
    /// <summary>
    ///     Project run ids as 32-char lowercase hex (RFC <c>N</c> format) so round-trips match
    ///     <see cref="Guid.ToString(string)" /> with <c>&quot;N&quot;</c> and SQL <c>UNIQUEIDENTIFIER</c> casting.
    /// </summary>
    internal const string ProjectionRow =
        """
        ComparisonRecordId, ComparisonType,
        LOWER(REPLACE(CONVERT(NVARCHAR(36), LeftRunId), N'-', N'')) AS LeftRunId,
        LOWER(REPLACE(CONVERT(NVARCHAR(36), RightRunId), N'-', N'')) AS RightRunId,
        LeftManifestVersion, RightManifestVersion,
        LeftExportRecordId, RightExportRecordId,
        Format, SummaryMarkdown, PayloadJson, Notes, CreatedUtc, Label, Tags
        """;

    /// <summary>
    ///     Dapper/sqlclient may hydrate <see cref="ComparisonRecord.LeftRunId" /> as the default GUID string form
    ///     (uppercase, hyphenated) even when inserts used <see cref="System.Guid.ToString(string)" /> <c>N</c>. Normalize after
    ///     read so callers see stable contract strings.
    /// </summary>
    internal static void NormalizeRunIdsForRead(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.LeftRunId = ToCanonicalRunIdStringOrNull(record.LeftRunId);
        record.RightRunId = ToCanonicalRunIdStringOrNull(record.RightRunId);
    }

    /// <returns>Lowercase <c>N</c> form when parseable as a GUID; whitespace to <c>null</c>; unparsed non-whitespace unchanged.</returns>
    internal static string? ToCanonicalRunIdStringOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (!Guid.TryParse(value.Trim(), out Guid g))
            return value.Trim();

        return g.ToString("N");
    }

    internal static void ThrowIfNonEmptyButNotGuid(string? value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        if (!Guid.TryParse(value, out _))
            throw new ArgumentException("Run id must be empty or parseable as a RFC GUID when using SQL persistence.", paramName);
    }

    internal static Guid? ToNullableSqlGuid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return Guid.TryParse(value, out Guid g) ? g : null;
    }
}
