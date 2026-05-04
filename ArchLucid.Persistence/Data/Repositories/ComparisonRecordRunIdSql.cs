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
