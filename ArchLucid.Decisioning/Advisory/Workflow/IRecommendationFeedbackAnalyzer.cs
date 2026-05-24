namespace ArchLucid.Decisioning.Advisory.Workflow;

/// <summary>
///     Aggregates persisted recommendation rows into coarse counts for learning and dashboards.
/// </summary>
/// <remarks>
///     Implemented by <c>ArchLucid.Persistence.Advisory.RecommendationFeedbackAnalyzer</c>. Used by
///     <see cref="ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningAnalyzer" /> when building profiles.
/// </remarks>
public interface IRecommendationFeedbackAnalyzer : ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer
{
    // Compatibility stub: canonical contract is inherited from Core.
}
