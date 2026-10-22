using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

internal static class ProductLearningPilotSignalRepositoryCore
{
    public const int MaxListTake = 500;

    public const int MaxAggregateCap = 500;

    public const int MaxThemeTake = 200;

    public const int MaxImprovementTake = 100;

    public static void ValidateInsert(ProductLearningPilotSignalRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (string.IsNullOrWhiteSpace(record.SubjectType))
            throw new ArgumentException("SubjectType is required.", nameof(record));

        if (string.IsNullOrWhiteSpace(record.Disposition))
            throw new ArgumentException("Disposition is required.", nameof(record));
    }

    public static ProductLearningPilotSignalRecord NormalizeInsert(
        ProductLearningPilotSignalRecord record,
        Func<DateTime> utcNow)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentNullException.ThrowIfNull(utcNow);
        ValidateInsert(record);

        Guid signalId = record.SignalId == Guid.Empty ? Guid.NewGuid() : record.SignalId;
        DateTime recordedUtc = record.RecordedUtc == default ? utcNow() : record.RecordedUtc;
        string triage = string.IsNullOrWhiteSpace(record.TriageStatus)
            ? ProductLearningTriageStatusValues.Open
            : record.TriageStatus;

        return record with
        {
            SignalId = signalId,
            RecordedUtc = recordedUtc,
            TriageStatus = triage,
        };
    }

    public static int ClampListTake(int take) => take < 1 ? 1 : Math.Min(take, MaxListTake);

    public static int ClampAggregateCap(int cap) => cap < 1 ? 1 : Math.Min(cap, MaxAggregateCap);

    public static int ClampThemeTake(int take) => take < 1 ? 1 : Math.Min(take, MaxThemeTake);

    public static int ClampImprovementTake(int take) => take < 1 ? 1 : Math.Min(take, MaxImprovementTake);

    public static int ClampMinOccurrences(int minOccurrences) => minOccurrences < 1 ? 1 : minOccurrences;

    public static FeedbackAggregate ToFeedbackAggregate(FeedbackAggregateSqlRow row)
    {
        ArgumentNullException.ThrowIfNull(row);
        string? pk = string.IsNullOrWhiteSpace(row.PatternKeyRaw) ? null : row.PatternKeyRaw.Trim();

        return new FeedbackAggregate
        {
            AggregateKey = row.AggregateKey,
            PatternKey = pk,
            SubjectTypeOrWorkflowArea = row.SubjectTypeOrWorkflowArea,
            DistinctRunCount = row.DistinctRunCount,
            TotalSignalCount = row.TotalSignalCount,
            TrustedCount = row.TrustedCount,
            RejectedCount = row.RejectedCount,
            RevisedCount = row.RevisedCount,
            NeedsFollowUpCount = row.NeedsFollowUpCount,
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            DominantThemeHint = string.IsNullOrWhiteSpace(row.DominantThemeHint)
                ? null
                : TruncateForDisplay(row.DominantThemeHint, 240),
            FirstSignalRecordedUtc = row.FirstSignalRecordedUtc,
            LastSignalRecordedUtc = row.LastSignalRecordedUtc,
        };
    }

    public static ArtifactOutcomeTrend ToArtifactOutcomeTrend(ArtifactOutcomeTrendSqlRow row, string? windowLabel)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new ArtifactOutcomeTrend
        {
            TrendKey = row.TrendKey,
            ArtifactTypeOrHint = row.ArtifactTypeOrHint,
            WindowLabel = windowLabel,
            AcceptedOrTrustedCount = row.AcceptedOrTrustedCount,
            RevisionCount = row.RevisionCount,
            RejectionCount = row.RejectionCount,
            NeedsFollowUpCount = row.NeedsFollowUpCount,
            DistinctRunCount = row.DistinctRunCount,
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            RepeatedThemeIndicator = string.IsNullOrWhiteSpace(row.RepeatedThemeIndicator)
                ? null
                : TruncateForDisplay(row.RepeatedThemeIndicator, 200),
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
        };
    }

    public static RepeatedCommentTheme ToRepeatedCommentTheme(RepeatedCommentThemeSqlRow row)
    {
        ArgumentNullException.ThrowIfNull(row);
        long n = row.OccurrenceCount;
        int count = n > int.MaxValue ? int.MaxValue : (int)n;

        return new RepeatedCommentTheme
        {
            ThemeKey = row.ThemeKey,
            OccurrenceCount = count,
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
            SampleCommentShort = row.SampleCommentShort,
        };
    }

    public static string TruncateForDisplay(string value, int maxChars) =>
        value.Length <= maxChars ? value : value[..maxChars];
}
