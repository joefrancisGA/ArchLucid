namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Maps optional API/contract run id strings to SQL <c>UNIQUEIDENTIFIER</c> parameters.</summary>
internal static class ComparisonRecordRunIdSql
{
    internal const string ProjectionRow =
        """
        ComparisonRecordId, ComparisonType,
        CONVERT(NVARCHAR(36), LeftRunId) AS LeftRunId,
        CONVERT(NVARCHAR(36), RightRunId) AS RightRunId,
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
