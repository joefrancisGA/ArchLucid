using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes finding-lifecycle sections on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class CrossReviewFindingLifecycleNormalizer
{
    internal static void NormalizeOnReport(EndToEndReplayComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (report.FindingLifecycleRecords.Count > 0)
        {
            List<CrossReviewFindingLifecycleRecord> normalizedRecords = report.FindingLifecycleRecords
                .Select(NormalizeRecord)
                .ToList();

            report.FindingLifecycleRecords = normalizedRecords;
            report.FindingLifecycle = CrossReviewFindingLifecycleSummarizer.Summarize(normalizedRecords);
            return;
        }

        if (report.FindingLifecycle is null)
            return;

        CrossReviewFindingLifecycleSummary summary = report.FindingLifecycle;
        string? honestyNote = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(summary.HonestyNote);
        report.FindingLifecycle = new CrossReviewFindingLifecycleSummary
        {
            NewlyIdentifiedCount = summary.NewlyIdentifiedCount,
            PreviouslyIdentifiedStillPresentCount = summary.PreviouslyIdentifiedStillPresentCount,
            ConfirmedResolvedCount = summary.ConfirmedResolvedCount,
            UnverifiedResolvedCount = summary.UnverifiedResolvedCount,
            AbsenceNotInformativeCount = summary.AbsenceNotInformativeCount,
            HonestyNote = honestyNote ?? string.Empty,
        };
    }

    private static CrossReviewFindingLifecycleRecord NormalizeRecord(CrossReviewFindingLifecycleRecord record) =>
        new()
        {
            State = record.State,
            ResolutionBasis = record.ResolutionBasis,
            CorrelationMethod = record.CorrelationMethod,
            Severity = record.Severity,
            SourceAgent = record.SourceAgent,
            LatestDisposition = record.LatestDisposition,
            PriorFindingId = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.PriorFindingId),
            CurrentFindingId = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.CurrentFindingId),
            Category = NormalizeRequiredDisplayLabel(record.Category),
            Message = NormalizeRequiredDisplayLabel(record.Message),
        };

    private static string NormalizeRequiredDisplayLabel(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
}
