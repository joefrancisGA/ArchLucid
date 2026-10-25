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

        if (!string.IsNullOrWhiteSpace(record.LeftRunId))
            record.LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(record.LeftRunId);

        if (!string.IsNullOrWhiteSpace(record.RightRunId))
            record.RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(record.RightRunId);

        record.LeftExportRecordId = NormalizeExportRecordIdOrNull(record.LeftExportRecordId);
        record.RightExportRecordId = NormalizeExportRecordIdOrNull(record.RightExportRecordId);
        record.LeftManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.LeftManifestVersion);
        record.RightManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.RightManifestVersion);
        record.Notes = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Notes);

        if (!string.IsNullOrWhiteSpace(record.Format))
            record.Format = record.Format.Trim();

        if (!string.IsNullOrWhiteSpace(record.ComparisonType))
            record.ComparisonType = record.ComparisonType.Trim();

        record.Label = TrimLabelOrNull(record.Label);
        NormalizeTagsInPlace(record.Tags);

        if (!string.IsNullOrWhiteSpace(record.SummaryMarkdown))
            record.SummaryMarkdown = record.SummaryMarkdown.Trim();
    }

    private static void NormalizeTagsInPlace(List<string> tags)
    {
        for (int i = 0; i < tags.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(tags[i]))
                tags[i] = tags[i].Trim();
        }
    }

    private static string? TrimLabelOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? value : value.Trim();

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId) =>
        string.IsNullOrWhiteSpace(exportRecordId)
            ? exportRecordId
            : RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
}
