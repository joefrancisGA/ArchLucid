namespace ArchLucid.Contracts.ProductLearning;

/// <summary>All product-learning dashboard slices from one scoped dashboard computation.</summary>
public sealed class ProductLearningDashboardBundleResponse
{
    public ProductLearningDashboardSummaryResponse Summary
    {
        get;
        init;
    } = new();

    public ProductLearningImprovementOpportunitiesResponse Opportunities
    {
        get;
        init;
    } = new();

    public ProductLearningArtifactOutcomeTrendsResponse Trends
    {
        get;
        init;
    } = new();

    public ProductLearningTriageQueueResponse Triage
    {
        get;
        init;
    } = new();
}
