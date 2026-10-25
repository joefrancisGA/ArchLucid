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

        record.Format = NormalizeRequiredStringColumn(record.Format);
        record.ComparisonType = NormalizeRequiredStringColumn(record.ComparisonType);

        record.Label = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Label);
        NormalizeTagsInPlace(record.Tags);

        record.SummaryMarkdown =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.SummaryMarkdown);
    }

    private static void NormalizeTagsInPlace(List<string> tags)
    {
        for (int i = tags.Count - 1; i >= 0; i--)
        {
            if (string.IsNullOrWhiteSpace(tags[i]))
            {
                tags.RemoveAt(i);
                continue;
            }

            tags[i] = tags[i].Trim();
        }
    }

    private static string NormalizeRequiredStringColumn(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

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
