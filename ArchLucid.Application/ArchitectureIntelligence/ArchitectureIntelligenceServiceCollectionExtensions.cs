using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ArchitectureIntelligenceServiceCollectionExtensions
{
    public static IServiceCollection AddArchitectureIntelligence(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddSingleton<IImmutableSourceStore, InMemoryImmutableSourceStore>();
        services.AddScoped<IArchitectureOntologyService, ArchitectureOntologyService>();
        services.AddScoped<IDifficultyBasedExtractionRouter, DifficultyBasedExtractionRouter>();
        services.AddScoped<IExtractionFidelityBenchmark, ExtractionFidelityBenchmark>();
        services.AddScoped<IArchitectureIntelligenceBenchmark, ArchitectureIntelligenceBenchmark>();
        services.AddScoped<IProgressiveInterviewService, ProgressiveInterviewService>();
        services.AddScoped<IEvidenceValidationPipeline, EvidenceValidationPipeline>();
        services.AddScoped<ISpecialistReviewService, SpecialistReviewService>();
        services.AddScoped<IAdversarialReviewService, AdversarialReviewService>();
        services.AddScoped<IArchitectureRecommendationEngine, ArchitectureRecommendationEngine>();
        services.AddScoped<IChangeImpactAnalyzer, ChangeImpactAnalyzer>();
        services.AddScoped<IIncrementalReReviewService, IncrementalReReviewService>();
        services.AddScoped<IMustNotFailEnforcer, MustNotFailEnforcer>();
        services.AddScoped<IReviewResultCache, ReviewResultCache>();
        services.AddScoped<IArtifactRoundTripService, ArtifactRoundTripService>();
        services.AddScoped<IClosedLoopArchitectureReasoningOrchestrator, ClosedLoopArchitectureReasoningOrchestrator>();
        services.AddScoped<IGoldenArchitectureTestRunner, GoldenArchitectureTestRunner>();

        return services;
    }
}
