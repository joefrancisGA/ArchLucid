using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes end-to-end comparison report payloads before persist, rehydrate, and replay.
/// </summary>
internal static class EndToEndReplayComparisonReportNormalizer
{
    internal static void NormalizePersistedPayload(EndToEndReplayComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (!string.IsNullOrWhiteSpace(report.LeftRunId))
            report.LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(report.LeftRunId);

        if (!string.IsNullOrWhiteSpace(report.RightRunId))
            report.RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(report.RightRunId);

        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
            ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);
    }
}
