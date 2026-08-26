using ArchLucid.Contracts.Abstractions.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

/// <inheritdoc />
public sealed partial class ProductLearningPlanningDerivationService(
    IProductLearningFeedbackAggregationService aggregationService,
    IProductLearningImprovementOpportunityService opportunityService,
    IProductLearningPilotSignalRepository signalRepository,
    IProductLearningPlanningRepository planningRepository,
    IProductLearningPlanningRetrievalContributor retrievalContributor)
    : IProductLearningPlanningDerivationService
{
    private const int MaxTakeThemeKeysPrefetch = ProductLearningPlanningRepositoryValidation.MaxTake;

    private const int MaxPilotSignalsHydrate = 8_000;

    private const int MaxSignalLinksPerPlan = 200;

    private const int MaxRetrievalCitationsInResponse = 40;

    private const int ThemeKeyMaxChars = ProductLearningPlanningRepositoryValidation.MaxThemeKeyLength;

    private const string DerivationRuleVersion = "59R-v1";

    private readonly IProductLearningPlanningRetrievalContributor _retrievalContributor =
        retrievalContributor ?? throw new ArgumentNullException(nameof(retrievalContributor));
}
