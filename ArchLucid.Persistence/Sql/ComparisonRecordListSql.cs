namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Comparison list/search projection without <c>PayloadJson</c> (TB-2057).
/// </summary>
internal static class ComparisonRecordListSql
{
    /// <summary>Columns for list/search; omit heavy <c>PayloadJson</c> payload.</summary>
    public const string SelectColumnsWithoutPayloadJson = """
                                                          ComparisonRecordId, ComparisonType,
                                                          LOWER(REPLACE(CONVERT(NVARCHAR(36), LeftRunId), N'-', N'')) AS LeftRunId,
                                                          LOWER(REPLACE(CONVERT(NVARCHAR(36), RightRunId), N'-', N'')) AS RightRunId,
                                                          LeftManifestVersion, RightManifestVersion,
                                                          LeftExportRecordId, RightExportRecordId,
                                                          Format, SummaryMarkdown, Notes, CreatedUtc, Label, Tags
                                                          """;
}
