using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    private static void RegisterProductLearning(IServiceCollection services)
    {
        services.AddScoped<IProductLearningPilotSignalRepository, DapperProductLearningPilotSignalRepository>();
        services.AddScoped<IProductLearningPlanningRepository, DapperProductLearningPlanningRepository>();
        services.AddScoped<IProductLearningFeedbackAggregationService, ProductLearningFeedbackAggregationService>();
        services.AddScoped<IProductLearningImprovementOpportunityService, ProductLearningImprovementOpportunityService>();
        services.AddScoped<IProductLearningDashboardService, ProductLearningDashboardService>();
        services.AddScoped<IProductLearningPlanningDerivationService, ProductLearningPlanningDerivationService>();
        services.AddScoped<IPatternInsightAggregateRepository, DapperPatternInsightAggregateRepository>();
    }
}
