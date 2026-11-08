using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims legacy padding on comparison records returned from scoped application reads.
/// </summary>
internal static class ComparisonRecordScopedReadNormalizer
{
    internal static void NormalizeListInPlace(IReadOnlyList<ComparisonRecord> records)
    {
        if (records.Count == 0)
            return;

        foreach (ComparisonRecord record in records)
            NormalizeInPlace(record);
    }

    internal static string? CanonicalizeComparisonTypeSearchFilter(string? comparisonType)
    {
        if (string.IsNullOrWhiteSpace(comparisonType))
            return null;

        string trimmed = NormalizeRequiredStringColumn(comparisonType);
        if (trimmed.Length == 0)
            return null;

        if (string.Equals(trimmed, ComparisonTypes.EndToEndReplay, StringComparison.OrdinalIgnoreCase))
            return ComparisonTypes.EndToEndReplay;

        if (string.Equals(trimmed, ComparisonTypes.ExportRecordDiff, StringComparison.OrdinalIgnoreCase))
            return ComparisonTypes.ExportRecordDiff;

        return trimmed;
    }

    internal static void NormalizeInPlace(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ComparisonRecordId = ComparisonRecordIdNormalizer.NormalizeRequired(record.ComparisonRecordId);

        record.LeftRunId = NormalizeRunIdColumnOrNull(record.LeftRunId);
        record.RightRunId = NormalizeRunIdColumnOrNull(record.RightRunId);

        record.LeftExportRecordId = NormalizeExportRecordIdOrNull(record.LeftExportRecordId);
        record.RightExportRecordId = NormalizeExportRecordIdOrNull(record.RightExportRecordId);
        record.LeftManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.LeftManifestVersion);
        record.RightManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.RightManifestVersion);
        record.Notes = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Notes);

        record.Format = NormalizeKnownFormatColumn(record.Format);
        record.ComparisonType = NormalizeKnownComparisonTypeColumn(record.ComparisonType);

        record.Label = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Label);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(record.Tags);

        record.SummaryMarkdown =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.SummaryMarkdown);
    }

    private static string NormalizeRequiredStringColumn(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string NormalizeKnownComparisonTypeColumn(string value)
    {
        string trimmed = NormalizeRequiredStringColumn(value);
        if (trimmed.Length == 0)
            return string.Empty;

        if (string.Equals(trimmed, ComparisonTypes.EndToEndReplay, StringComparison.OrdinalIgnoreCase))
            return ComparisonTypes.EndToEndReplay;

        if (string.Equals(trimmed, ComparisonTypes.ExportRecordDiff, StringComparison.OrdinalIgnoreCase))
            return ComparisonTypes.ExportRecordDiff;

        return string.Empty;
    }

    private static string NormalizeKnownFormatColumn(string value)
    {
        string trimmed = NormalizeRequiredStringColumn(value);
        if (trimmed.Length == 0)
            return string.Empty;

        return string.Equals(trimmed, ComparisonTypes.FormatJsonMarkdown, StringComparison.OrdinalIgnoreCase)
            ? ComparisonTypes.FormatJsonMarkdown
            : string.Empty;
    }

    private static string? NormalizeRunIdColumnOrNull(string? runId)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(runId);
        if (string.IsNullOrEmpty(normalized))
            return null;

        return AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(normalized);
    }

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return null;

        return RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
    }
}
