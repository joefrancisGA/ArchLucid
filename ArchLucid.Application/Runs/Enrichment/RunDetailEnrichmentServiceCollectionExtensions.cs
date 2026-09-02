using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Runs.Enrichment;

public static class RunDetailEnrichmentServiceCollectionExtensions
{
    public static IServiceCollection AddAuthorityRunDetailEnrichment(this IServiceCollection services)
    {
        services.AddScoped<RunDetailHeaderEnrichmentSlice>();
        services.AddScoped<RunDetailLlmCostEnrichmentSlice>();
        services.AddScoped<RunDetailEstimatedUsdSavingsEnrichmentSlice>();
        services.AddScoped<RunDetailArchitectureResultsEnrichmentSlice>();
        services.AddScoped<RunDetailBuyerResultsEnrichmentSlice>();
        services.AddScoped<RunDetailRetrievalGroundingEnrichmentSlice>();
        services.AddScoped<RunDetailDecisionExplainabilityEnrichmentSlice>();
        services.AddScoped<RunDetailTrustEvidenceEnrichmentSlice>();
        services.AddScoped<IAuthorityRunDetailEnrichmentComposer, AuthorityRunDetailEnrichmentComposer>();
        return services;
    }
}
