using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
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
                .Where(record => !IsDisplayEmptyShell(record))
                .ToList();

            DedupeLifecycleRecordsKeepFirstInPlace(normalizedRecords);

            report.FindingLifecycleRecords = normalizedRecords;

            if (normalizedRecords.Count == 0)
            {
                report.FindingLifecycle = null;
                return;
            }

            report.FindingLifecycle = CrossReviewFindingLifecycleSummarizer.Summarize(normalizedRecords);
            return;
        }

        if (report.FindingLifecycle is null)
            return;

        CrossReviewFindingLifecycleSummary summary = report.FindingLifecycle;
        string? honestyNote = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(summary.HonestyNote);
        report.FindingLifecycle = new CrossReviewFindingLifecycleSummary
        {
            NewlyIdentifiedCount = ClampCount(summary.NewlyIdentifiedCount),
            PreviouslyIdentifiedStillPresentCount = ClampCount(summary.PreviouslyIdentifiedStillPresentCount),
            ConfirmedResolvedCount = ClampCount(summary.ConfirmedResolvedCount),
            UnverifiedResolvedCount = ClampCount(summary.UnverifiedResolvedCount),
            AbsenceNotInformativeCount = ClampCount(summary.AbsenceNotInformativeCount),
            HonestyNote = honestyNote ?? string.Empty,
        };

        if (report.FindingLifecycle is not null && IsPersistedEmptyShell(report.FindingLifecycle))
            report.FindingLifecycle = null;
    }

    private static bool IsDisplayEmptyShell(CrossReviewFindingLifecycleRecord record) =>
        record.Category.Length == 0
        && record.Message.Length == 0
        && record.PriorFindingId is null
        && record.CurrentFindingId is null;

    internal static bool IsPersistedEmptyShell(CrossReviewFindingLifecycleSummary summary) =>
        summary.NewlyIdentifiedCount == 0
        && summary.PreviouslyIdentifiedStillPresentCount == 0
        && summary.ConfirmedResolvedCount == 0
        && summary.UnverifiedResolvedCount == 0
        && summary.AbsenceNotInformativeCount == 0
        && summary.HonestyNote.Length == 0;

    private static int ClampCount(int value) => value < 0 ? 0 : value;

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

    private static void DedupeLifecycleRecordsKeepFirstInPlace(List<CrossReviewFindingLifecycleRecord> records)
    {
        if (records.Count < 2)
            return;

        HashSet<LifecycleRecordIdentity> seen = [];
        List<CrossReviewFindingLifecycleRecord> distinct = [];

        foreach (CrossReviewFindingLifecycleRecord record in records)
        {
            if (!seen.Add(LifecycleRecordIdentity.From(record)))
                continue;

            distinct.Add(record);
        }

        if (distinct.Count == records.Count)
            return;

        records.Clear();
        records.AddRange(distinct);
    }

    private readonly record struct LifecycleRecordIdentity(
        CrossReviewFindingLifecycleState State,
        CrossReviewFindingResolutionBasis ResolutionBasis,
        FindingCorrelationMethod CorrelationMethod,
        FindingSeverity Severity,
        AgentType SourceAgent,
        FindingDisposition? LatestDisposition,
        string PriorFindingId,
        string CurrentFindingId,
        string Category,
        string Message)
    {
        internal static LifecycleRecordIdentity From(CrossReviewFindingLifecycleRecord record) =>
            new(
                record.State,
                record.ResolutionBasis,
                record.CorrelationMethod,
                record.Severity,
                record.SourceAgent,
                record.LatestDisposition,
                record.PriorFindingId ?? string.Empty,
                record.CurrentFindingId ?? string.Empty,
                record.Category,
                record.Message);
    }
}
