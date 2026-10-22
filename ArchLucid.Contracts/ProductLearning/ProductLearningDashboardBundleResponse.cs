namespace ArchLucid.Contracts.ProductLearning;

/// <summary>All product-learning dashboard slices from one scoped dashboard computation.</summary>
public sealed class ProductLearningDashboardBundleResponse
{
    private ProductLearningDashboardSummaryResponse summary = new();

    public ProductLearningDashboardSummaryResponse Summary
    {
        get => summary;
        init => summary = value ?? new ProductLearningDashboardSummaryResponse();
    }

    private ProductLearningImprovementOpportunitiesResponse opportunities = new();

    public ProductLearningImprovementOpportunitiesResponse Opportunities
    {
        get => opportunities;
        init => opportunities = value ?? new ProductLearningImprovementOpportunitiesResponse();
    }

    private ProductLearningArtifactOutcomeTrendsResponse trends = new();

    public ProductLearningArtifactOutcomeTrendsResponse Trends
    {
        get => trends;
        init => trends = value ?? new ProductLearningArtifactOutcomeTrendsResponse();
    }

    private ProductLearningTriageQueueResponse triage = new();

    public ProductLearningTriageQueueResponse Triage
    {
        get => triage;
        init => triage = value ?? new ProductLearningTriageQueueResponse();
    }
}
