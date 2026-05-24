using ArchLucid.Decisioning.Findings;
using ArchLucid.Host.Composition.Alerts;

using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Ensures Core persistence ports and Decisioning compatibility stub interfaces resolve to the same scoped graph.
    ///     Phase 2e+ moved pipeline/advisory consumers onto Core ports; Decisioning keeps forwarding interfaces for legacy
    ///     call sites (e.g. <see cref="ArchLucid.Application.Advisory.AdvisoryScanRunner" />).
    /// </summary>
    /// <remarks>
    ///     Invoked after subsystem registrars so TryAdd only fills gaps (OpenAPI host, InMemory storage, ValidateOnBuild).
    /// </remarks>
    private static void RegisterCorePersistencePortCompatibilityServices(IServiceCollection services)
    {
        services.TryAddScoped<ArchLucid.Core.Persistence.Ports.IFindingsSnapshotEvaluationConfidenceEnricher,
            NullFindingsSnapshotEvaluationConfidenceEnricher>();
        services.TryAddScoped<ArchLucid.Decisioning.Interfaces.IFindingsSnapshotEvaluationConfidenceEnricher>(static sp =>
            (ArchLucid.Decisioning.Interfaces.IFindingsSnapshotEvaluationConfidenceEnricher)sp.GetRequiredService<
                ArchLucid.Core.Persistence.Ports.IFindingsSnapshotEvaluationConfidenceEnricher>());

        services.TryAddScoped<ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService>(static sp =>
            (ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService)sp.GetRequiredService<
                ArchLucid.Core.Persistence.Ports.IRecommendationLearningService>());

        services.TryAddScoped<ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService>(static sp =>
            (ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService)sp.GetRequiredService<
                ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService>());

        services.TryAddScoped<ArchLucid.Decisioning.Alerts.Simulation.IRuleSimulationService>(static sp =>
            new RuleSimulationServiceDecisioningPortAdapter(
                sp.GetRequiredService<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService>()));

        services.TryAddScoped<ArchLucid.Decisioning.Alerts.IAlertService>(static sp =>
            new AlertServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.IAlertService>()));

        services.TryAddScoped<ArchLucid.Decisioning.Alerts.Composite.ICompositeAlertService>(static sp =>
            new CompositeAlertServiceDecisioningPortAdapter(
                sp.GetRequiredService<ArchLucid.Core.Alerts.Composite.ICompositeAlertService>()));

        services.TryAddScoped<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(static sp =>
            (ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader)sp.GetRequiredService<
                ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader>());
    }
}
