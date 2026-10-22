namespace ArchLucid.Decisioning.Advisory.Learning;

/// <summary>
///     Builds and retrieves <see cref="RecommendationLearningProfile" /> snapshots from historical recommendation rows in
///     a scope.
/// </summary>
/// <remarks>
///     Implemented by <c>ArchLucid.Application.Advisory.RecommendationLearningService</c>. HTTP:
///     <c>RecommendationLearningController</c>.
/// </remarks>
public interface IRecommendationLearningService : ArchLucid.Core.Persistence.Ports.IRecommendationLearningService;
