using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ArchitectureIntelligenceServiceCollectionExtensions
{
    public static IServiceCollection AddArchitectureIntelligence(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        RegisterCoreServices(services);

        return services;
    }

    public static IServiceCollection AddArchitectureIntelligenceInMemoryPersistence(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.TryAddSingleton<IArchitectureIntelligencePersistence, InMemoryArchitectureIntelligencePersistence>();
        services.TryAddSingleton<IImmutableSourceStore, InMemoryImmutableSourceStore>();

        return services;
    }

    public static IServiceCollection AddArchitectureIntelligenceSqlPersistence(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        // Persistence is registered by SqlStorageProviderRegistrar as DapperArchitectureIntelligencePersistence.
        // Only swap the source-store binding so SqlImmutableSourceStore is used.
        services.RemoveAll<IImmutableSourceStore>();
        services.AddScoped<IImmutableSourceStore, SqlImmutableSourceStore>();

        return services;
    }

    private static void RegisterCoreServices(IServiceCollection services)
    {
        services.AddScoped<IArchitectureIntelligenceLlmGateway, ArchitectureIntelligenceLlmGateway>();

        services.AddScoped<DifficultyBasedExtractionRouter>();
        services.AddScoped<IDifficultyBasedExtractionRouter>(static sp =>
            sp.GetRequiredService<DifficultyBasedExtractionRouter>());
        services.AddScoped<IAsyncArchitectureExtractionService, LlmBackedArchitectureExtractionService>();

        services.AddScoped<SpecialistReviewService>();
        services.AddScoped<ISpecialistReviewService>(static sp => sp.GetRequiredService<SpecialistReviewService>());
        services.AddScoped<IAsyncSpecialistReviewService, LlmBackedSpecialistReviewService>();

        services.AddScoped<ArchitectureRecommendationEngine>();
        services.AddScoped<IArchitectureRecommendationEngine>(static sp =>
            sp.GetRequiredService<ArchitectureRecommendationEngine>());
        services.AddScoped<IAsyncArchitectureRecommendationEngine, LlmBackedArchitectureRecommendationEngine>();

        services.AddScoped<IArchitectureOntologyService, ArchitectureOntologyService>();
        services.AddScoped<IExtractionFidelityBenchmark, ExtractionFidelityBenchmark>();
        services.AddScoped<IArchitectureIntelligenceBenchmark, ArchitectureIntelligenceBenchmark>();
        services.AddScoped<IProgressiveInterviewService, ProgressiveInterviewService>();
        services.AddScoped<IEvidenceValidationPipeline>(static sp =>
            new EvidenceValidationPipeline(sp.GetService<IArchitectureIntelligenceLlmGateway>()));
        services.AddScoped<AdversarialReviewService>();
        services.AddScoped<IAdversarialReviewService>(static sp => sp.GetRequiredService<AdversarialReviewService>());
        services.AddScoped<IAsyncAdversarialReviewService, LlmBackedAdversarialReviewService>();
        services.AddScoped<IChangeImpactAnalyzer, ChangeImpactAnalyzer>();
        services.AddScoped<IArchitectureModelDiffApplier, ArchitectureModelDiffApplier>();
        services.AddScoped<IIncrementalReReviewService, IncrementalReReviewService>();
        services.AddScoped<IMustNotFailEnforcer, MustNotFailEnforcer>();
        services.AddScoped<ITrustPublishGate, TrustPublishGate>();
        services.AddScoped<IArchitectureIntelligenceProductPublishService, ArchitectureIntelligenceProductPublishService>();
        services.AddScoped<IReviewResultCache, ReviewResultCache>();
        services.AddScoped<IArchitectureIntelligenceReviewTierBudgetGuard, ArchitectureIntelligenceReviewTierBudgetGuard>();
        services.AddScoped<IArtifactRoundTripService, ArtifactRoundTripService>();
        services.AddScoped<IClosedLoopArchitectureReasoningOrchestrator, ClosedLoopArchitectureReasoningOrchestrator>();
        services.AddScoped<IGoldenArchitectureTestRunner, GoldenArchitectureTestRunner>();
    }
}
