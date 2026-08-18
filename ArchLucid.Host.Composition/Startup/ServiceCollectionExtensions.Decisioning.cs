using ArchLucid.Capabilities.Cost;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Compliance.Evaluators;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Plugins;
using ArchLucid.Host.Composition.Compliance;
using ArchLucid.Persistence.Coordination.Compliance;
using ArchLucid.Provenance;

using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;

using Di = ArchLucid.Decisioning.Interfaces;
using Dm = ArchLucid.Decisioning.Manifest.Builders;
using Dr = ArchLucid.Decisioning.Rules;
using Ds = ArchLucid.Decisioning.Services;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterDecisioningEngines(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IGraphCoverageAnalyzer, GraphCoverageAnalyzer>();

        string complianceRulePackPath = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");
        string gaPath = Path.Combine(AppContext.BaseDirectory, "Compliance", "RulePacks", "ga-starter-compliance.rules.json");
        services.AddSingleton<ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader>(_ => new MergedComplianceRulePackLoader(
            [new FileComplianceRulePackLoader(complianceRulePackPath), new FileComplianceRulePackLoader(gaPath)]));
        services.AddSingleton<IComplianceRulePackLoader>(static sp =>
            (IComplianceRulePackLoader)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IComplianceRulePackLoader>());
        services.AddScoped<PolicyFilteredComplianceRulePackProvider>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider>(static sp =>
            sp.GetRequiredService<PolicyFilteredComplianceRulePackProvider>());
        services.AddScoped<IComplianceRulePackProvider, ComplianceRulePackProviderDecisioningPortAdapter>();
        services.AddSingleton<IComplianceRulePackValidator, ComplianceRulePackValidator>();
        services.AddSingleton<IComplianceEvaluator, GraphComplianceEvaluator>();

        services.AddScoped<Di.IFindingEngine, Ds.RequirementFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequirementExpectationFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequirementGapFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequirementCrossRunDiffFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyStructureFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyCrossRunDiffFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyAntiPatternFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineExpectationFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineCompletenessFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityGapFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.PolicyApplicabilityFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.PolicyCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequirementCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.ComplianceFindingEngine>();
        services.AddScoped<Di.IFindingEngine, CostConstraintFindingEngine>();
        services.AddScoped<Di.IFindingEngine, CostBreachFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.OrphanedAzureResourceFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.AdvisorCostRecommendationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.GraphAzureInventoryReconciliationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.GraphAwsInventoryReconciliationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.GraphGcpInventoryReconciliationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.OrphanedAwsResourceFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.OrphanedGcpResourceFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.AwsCostRecommendationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.GcpCostRecommendationFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.AzureInventorySecurityBaselineFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.AwsInventorySecurityBaselineFindingEngine>();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.GcpInventorySecurityBaselineFindingEngine>();

        services.TryAddSingleton<IReservationCoverageProvider, StubReservationCoverageProvider>();
        services.Configure<HumanReviewFindingOptions>(configuration.GetSection(HumanReviewFindingOptions.SectionPath));
        services.Configure<FindingPayloadRemediationOptions>(configuration.GetSection(FindingPayloadRemediationOptions.SectionPath));
        services.PostConfigure<FindingPayloadRemediationOptions>(static o => o.Normalize());
        services.Configure<InsightDensityGateOptions>(configuration.GetSection(InsightDensityGateOptions.SectionPath));
        services.AddSingleton<IInsightDensityGate, DeterministicInsightDensityGate>();
        services.TryAddSingleton<IInsightDensityLlmJudge, NoOpInsightDensityLlmJudge>();

        RegisterPluginFindingEngines(services, configuration);

        services.AddScoped<ArchLucid.Core.Persistence.Ports.IFindingsOrchestrator, Ds.FindingsOrchestrator>();
        services.AddScoped<Di.IFindingsOrchestrator>(static sp =>
            (Di.IFindingsOrchestrator)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IFindingsOrchestrator>());
        services.AddSingleton<Di.IFindingPayloadValidator, Ds.FindingPayloadValidator>();
        services.AddSingleton<IFeasibilityVerdictValidator, FeasibilityVerdictValidator>();
        services.AddSingleton<FeasibilityVerdictBuilder>();
        services.AddSingleton<IAuthorityFeasibilityVerdictComposer, AuthorityFeasibilityVerdictComposer>();
        services.TryAddSingleton<IDecisionIntakeTrailProvider, NullDecisionIntakeTrailProvider>();
        services.AddSingleton<FindingConfidenceCalculator>();
        services.AddSingleton<IExplanationFaithfulnessChecker, ExplanationFaithfulnessChecker>();
        services.AddSingleton<Di.IDecisionRuleProvider, Dr.InMemoryDecisionRuleProvider>();
        services.AddScoped<Di.IGoldenManifestBuilder, Dm.DefaultGoldenManifestBuilder>();
        services.AddSingleton<Di.IGoldenManifestValidator, Ds.GoldenManifestValidator>();
        services.AddSingleton<IManifestHashService, Ds.ManifestHashService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IDecisionEngine, Ds.RuleBasedDecisionEngine>();
        services.AddScoped<Di.IDecisionEngine>(static sp =>
            (Di.IDecisionEngine)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IDecisionEngine>());
        services.AddSingleton<IProvenanceBuilder, ProvenanceBuilder>();
        services.AddScoped<IAuthorityCommitProjectionBuilder, Decisioning.Manifest.AuthorityCommitProjectionBuilder>();
    }

    private static void RegisterPluginFindingEngines(IServiceCollection services, IConfiguration configuration)
    {
        string? pluginDirectory = configuration["ArchLucid:FindingEngines:PluginDirectory"];
        ILogger logger = NullLoggerFactory.Instance.CreateLogger("FindingEnginePlugins");

        foreach (Type engineType in FindingEnginePluginDiscovery.Discover(pluginDirectory, logger))

            services.TryAddEnumerable(ServiceDescriptor.Scoped(typeof(Di.IFindingEngine), engineType));

    }
}
