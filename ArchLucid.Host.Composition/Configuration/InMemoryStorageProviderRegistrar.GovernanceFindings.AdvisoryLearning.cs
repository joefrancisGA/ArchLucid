using ArchLucid.Application.Advisory;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.WeeklyDigest;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterGovernanceFindingsAdvisoryLearning(IServiceCollection services)
    {
        services.AddSingleton<IRecommendationRepository, InMemoryRecommendationRepository>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService, RecommendationWorkflowService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer, RecommendationFeedbackAnalyzer>();
        services.AddSingleton<IRecommendationLearningProfileRepository, InMemoryRecommendationLearningProfileRepository>();
        services.AddSingleton<RecommendationLearningBuildGate>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningOperationalService, RecommendationLearningOperationalService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService, RecommendationLearningService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService>(sp => (ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService>());
        services.AddSingleton<IAdvisoryScanScheduleRepository, InMemoryAdvisoryScanScheduleRepository>();
        services.AddSingleton<IAdvisoryScanExecutionRepository, InMemoryAdvisoryScanExecutionRepository>();
        services.AddSingleton<IArchitectureDigestRepository, InMemoryArchitectureDigestRepository>();
        services.AddSingleton<IArchitectureReviewRecurrenceScheduleRepository, InMemoryArchitectureReviewRecurrenceScheduleRepository>();
        services.AddSingleton<IDigestSubscriptionRepository, InMemoryDigestSubscriptionRepository>();
        services.AddSingleton<IDigestDeliveryAttemptRepository, InMemoryDigestDeliveryAttemptRepository>();
    }
}
