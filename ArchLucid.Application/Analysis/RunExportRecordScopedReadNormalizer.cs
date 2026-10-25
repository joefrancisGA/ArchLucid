using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims legacy padding on export records returned from scoped application reads and replay.
/// </summary>
internal static class RunExportRecordScopedReadNormalizer
{
    internal static void NormalizeInPlace(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.ExportRecordId);
        record.RunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(record.RunId);
        PersistedAnalysisExportRequestDeterminismNormalizer.NormalizeRunExportRecordDenormalizedColumns(record);
    }
}
