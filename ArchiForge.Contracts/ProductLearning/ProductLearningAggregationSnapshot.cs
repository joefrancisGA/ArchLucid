namespace ArchiForge.Contracts.ProductLearning;

/// <summary>
/// Raw and lightly filtered aggregation inputs for a scope (built before opportunity ranking).
/// </summary>
public sealed class ProductLearningAggregationSnapshot
{
    public required ProductLearningScope Scope { get; init; }

    public DateTime? SinceUtc { get; init; }

    public IReadOnlyList<FeedbackAggregate> FeedbackRollups { get; init; } = Array.Empty<FeedbackAggregate>();

    public IReadOnlyList<ArtifactOutcomeTrend> ArtifactTrends { get; init; } = Array.Empty<ArtifactOutcomeTrend>();

    public IReadOnlyList<FeedbackAggregate> TopRejectedRevisedRollups { get; init; } = Array.Empty<FeedbackAggregate>();

    public IReadOnlyList<RepeatedCommentTheme> RepeatedCommentThemes { get; init; } = Array.Empty<RepeatedCommentTheme>();
}
