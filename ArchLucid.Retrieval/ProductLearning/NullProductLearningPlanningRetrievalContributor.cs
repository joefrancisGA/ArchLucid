using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Retrieval.ProductLearning;

/// <summary>No-op when pilot-feedback retrieval is disabled.</summary>
public sealed class NullProductLearningPlanningRetrievalContributor : IProductLearningPlanningRetrievalContributor
{
    public Task IndexPilotSignalsAsync(
        ProductLearningScope scope,
        IReadOnlyList<ProductLearningPilotSignalRecord> signals,
        CancellationToken cancellationToken) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<PlanningRetrievalCitation>> RetrievePriorsForOpportunityAsync(
        ProductLearningScope scope,
        ImprovementOpportunity opportunity,
        CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<PlanningRetrievalCitation>>([]);
}
