using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Contracts.Abstractions.ProductLearning;

/// <summary>Pilot-feedback retrieval indexing and priors for planning materialize (TB-879).</summary>
public interface IProductLearningPlanningRetrievalContributor
{
    Task IndexPilotSignalsAsync(
        ProductLearningScope scope,
        IReadOnlyList<ProductLearningPilotSignalRecord> signals,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PlanningRetrievalCitation>> RetrievePriorsForOpportunityAsync(
        ProductLearningScope scope,
        ImprovementOpportunity opportunity,
        CancellationToken cancellationToken);
}
