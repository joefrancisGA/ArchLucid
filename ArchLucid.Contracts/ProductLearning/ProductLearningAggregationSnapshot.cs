using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>
///     Raw and lightly filtered aggregation inputs for a scope (built before opportunity ranking).
/// </summary>
public sealed class ProductLearningAggregationSnapshot
{
    public required ProductLearningScope Scope
    {
        get;
        init;
    }

    public DateTime? SinceUtc
    {
        get;
        init;
    }

    private IReadOnlyList<FeedbackAggregate> feedbackRollups = [];

    public IReadOnlyList<FeedbackAggregate> FeedbackRollups
    {
        get => feedbackRollups;
        init => feedbackRollups = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ArtifactOutcomeTrend> artifactTrends = [];

    public IReadOnlyList<ArtifactOutcomeTrend> ArtifactTrends
    {
        get => artifactTrends;
        init => artifactTrends = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<FeedbackAggregate> topRejectedRevisedRollups = [];

    /// <summary>
    ///     Reserved: reject/revise-focused rollups are not merged into the dashboard or report pipeline in 58R
    ///     (always empty from <c>IProductLearningFeedbackAggregationService.GetSnapshotAsync</c> to avoid an extra query).
    /// </summary>
    public IReadOnlyList<FeedbackAggregate> TopRejectedRevisedRollups
    {
        get => topRejectedRevisedRollups;
        init => topRejectedRevisedRollups = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RepeatedCommentTheme> repeatedCommentThemes = [];

    public IReadOnlyList<RepeatedCommentTheme> RepeatedCommentThemes
    {
        get => repeatedCommentThemes;
        init => repeatedCommentThemes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
