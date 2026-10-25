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
    }

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId) =>
        string.IsNullOrWhiteSpace(exportRecordId)
            ? exportRecordId
            : RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
}
