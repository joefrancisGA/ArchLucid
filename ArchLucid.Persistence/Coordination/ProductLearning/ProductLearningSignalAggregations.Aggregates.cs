using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

public static partial class ProductLearningSignalAggregations
{
    public static IEnumerable<ProductLearningPilotSignalRecord> FilterScope(
        IEnumerable<ProductLearningPilotSignalRecord> source,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc)
    {
        IEnumerable<ProductLearningPilotSignalRecord> q = source.Where(r =>
            r.TenantId == tenantId &&
            r.WorkspaceId == workspaceId &&
            r.ProjectId == projectId);

        if (sinceUtc.HasValue)

            q = q.Where(r => r.RecordedUtc >= sinceUtc.Value);


        return q;
    }

    public static IReadOnlyList<FeedbackAggregate> BuildRunFeedbackAggregates(
        IEnumerable<ProductLearningPilotSignalRecord> scoped,
        int maxAggregates)
    {
        List<FeedbackAggregate> list = scoped
            .GroupBy(r => BuildAggregateKey(r.PatternKey, r.SubjectType, r.ArtifactHint))
            .Select(MapGroupToFeedbackAggregate)
            .OrderByDescending(static a => a.LastSignalRecordedUtc)
            .ThenBy(static a => a.AggregateKey, StringComparer.Ordinal)
            .Take(maxAggregates < 1 ? 1 : Math.Min(maxAggregates, 500))
            .ToList();

        return list;
    }

    public static IReadOnlyList<ArtifactOutcomeTrend> BuildArtifactOutcomeTrends(
        IEnumerable<ProductLearningPilotSignalRecord> scoped,
        string? windowLabel,
        int maxTrends)
    {
        List<ArtifactOutcomeTrend> list = scoped
            .GroupBy(r => BuildTrendKey(r.SubjectType, r.ArtifactHint))
            .Select(g => MapGroupToArtifactTrend(g, windowLabel))
            .OrderByDescending(static t => t.RejectionCount + t.RevisionCount + t.NeedsFollowUpCount)
            .ThenBy(static t => t.TrendKey, StringComparer.Ordinal)
            .Take(maxTrends < 1 ? 1 : Math.Min(maxTrends, 500))
            .ToList();

        return list;
    }

    public static IReadOnlyList<FeedbackAggregate> BuildTopRejectedRevisedRollups(
        IEnumerable<ProductLearningPilotSignalRecord> scoped,
        int take)
    {
        int cap = take < 1 ? 1 : Math.Min(take, 200);

        return BuildRunFeedbackAggregates(scoped, 500)
            .OrderByDescending(static a => a.RejectedCount + a.RevisedCount)
            .ThenByDescending(static a => a.LastSignalRecordedUtc)
            .ThenBy(static a => a.AggregateKey, StringComparer.Ordinal)
            .Take(cap)
            .ToList();
    }

    public static IReadOnlyList<RepeatedCommentTheme> BuildRepeatedCommentThemes(
        IEnumerable<ProductLearningPilotSignalRecord> scoped,
        int minOccurrences,
        int take)
    {
        int min = minOccurrences < 1 ? 1 : minOccurrences;
        int cap = take < 1 ? 1 : Math.Min(take, 200);

        List<RepeatedCommentTheme> list = scoped
            .Select(r => new { Row = r, Key = NormalizeCommentThemeKey(r.CommentShort) })
            .Where(x => x.Key is not null)
            .GroupBy(x => x.Key!, StringComparer.Ordinal)
            .Where(g => g.Count() >= min)
            .Select(g => new RepeatedCommentTheme
            {
                ThemeKey = g.Key,
                OccurrenceCount = g.Count(),
                FirstSeenUtc = g.Min(x => x.Row.RecordedUtc),
                LastSeenUtc = g.Max(x => x.Row.RecordedUtc),
                SampleCommentShort = g.Select(x => x.Row.CommentShort ?? string.Empty)
                    .Where(static s => !string.IsNullOrWhiteSpace(s))
                    .OrderBy(static s => s, StringComparer.Ordinal)
                    .First()
            })
            .OrderByDescending(static t => t.OccurrenceCount)
            .ThenBy(static t => t.ThemeKey, StringComparer.Ordinal)
            .Take(cap)
            .ToList();

        return list;
    }

    private static FeedbackAggregate MapGroupToFeedbackAggregate(
        IGrouping<string, ProductLearningPilotSignalRecord> g)
    {
        string aggregateKey = g.Key;
        string subjectType = g.Select(static r => r.SubjectType)
            .OrderBy(static s => s, StringComparer.Ordinal)
            .First();
        ProductLearningPilotSignalRecord probe = g.First(r => r.SubjectType == subjectType);
        string? patternKey = string.IsNullOrWhiteSpace(probe.PatternKey) ? null : probe.PatternKey.Trim();

        int distinctRuns = g
            .Where(static r => !string.IsNullOrWhiteSpace(r.ArchitectureRunId))
            .Select(static r => r.ArchitectureRunId!)
            .Distinct(StringComparer.Ordinal)
            .Count();

        string? dominant = g
            .Select(static r => r.CommentShort)
            .Where(static c => !string.IsNullOrWhiteSpace(c))
            .OrderBy(static c => c!, StringComparer.Ordinal)
            .FirstOrDefault();

        return new FeedbackAggregate
        {
            AggregateKey = aggregateKey,
            PatternKey = patternKey,
            SubjectTypeOrWorkflowArea = subjectType,
            DistinctRunCount = distinctRuns,
            TotalSignalCount = g.Count(),
            TrustedCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Trusted),
            RejectedCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Rejected),
            RevisedCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Revised),
            NeedsFollowUpCount =
                g.Count(static r => r.Disposition == ProductLearningDispositionValues.NeedsFollowUp),
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            DominantThemeHint = dominant is null ? null : TruncateHint(dominant, 240),
            FirstSignalRecordedUtc = g.Min(static r => r.RecordedUtc),
            LastSignalRecordedUtc = g.Max(static r => r.RecordedUtc)
        };
    }

    private static ArtifactOutcomeTrend MapGroupToArtifactTrend(
        IGrouping<string, ProductLearningPilotSignalRecord> g,
        string? windowLabel)
    {
        ProductLearningPilotSignalRecord first = g.First();

        string artifactOrHint = BuildArtifactTypeOrHint(first.SubjectType, first.ArtifactHint);

        string? theme = g
            .Select(static r => r.CommentShort)
            .Where(static c => !string.IsNullOrWhiteSpace(c))
            .OrderBy(static c => c!, StringComparer.Ordinal)
            .FirstOrDefault();

        int distinctRuns = g
            .Where(static r => !string.IsNullOrWhiteSpace(r.ArchitectureRunId))
            .Select(static r => r.ArchitectureRunId!)
            .Distinct(StringComparer.Ordinal)
            .Count();

        return new ArtifactOutcomeTrend
        {
            TrendKey = g.Key,
            ArtifactTypeOrHint = artifactOrHint,
            WindowLabel = windowLabel,
            AcceptedOrTrustedCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Trusted),
            RevisionCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Revised),
            RejectionCount = g.Count(static r => r.Disposition == ProductLearningDispositionValues.Rejected),
            NeedsFollowUpCount =
                g.Count(static r => r.Disposition == ProductLearningDispositionValues.NeedsFollowUp),
            DistinctRunCount = distinctRuns,
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            RepeatedThemeIndicator = theme is null ? null : TruncateHint(theme, 200),
            FirstSeenUtc = g.Min(static r => r.RecordedUtc),
            LastSeenUtc = g.Max(static r => r.RecordedUtc)
        };
    }
}
