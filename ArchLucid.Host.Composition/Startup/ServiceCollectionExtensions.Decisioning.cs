using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Capabilities.Cost;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Compliance.Evaluators;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Hosting;
using ArchLucid.Decisioning.Plugins;
using ArchLucid.Decisioning.Risk;
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
        services.AddSingleton<RequiredCapabilityCoverageAnalyzer>();

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
        services.AddScoped<Di.IFindingEngine, Ds.DrRpoTopologyFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyStructureFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyCrossRunDiffFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TopologyAntiPatternFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineExpectationFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityBaselineCompletenessFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityGapFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SecurityCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.ExternalExposureFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.SegmentationSemanticsFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.DeclarationSecurityBaselineFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.DeclarationPremiseConflictFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.TrustBoundaryFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.PrivilegedAccessFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.PolicyApplicabilityFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.PolicyCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequirementCoverageFindingEngine>();
        services.AddScoped<Di.IFindingEngine, Ds.RequiredCapabilityCoverageFindingEngine>();
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
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.OpenCommitmentFindingEngine>();
        services.AddPortfolioRecurrenceFindingEngine();
        services.AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.PortfolioRecurrenceFindingEngine>();

        services.TryAddSingleton<IReservationCoverageProvider, StubReservationCoverageProvider>();
        services.Configure<HumanReviewFindingOptions>(configuration.GetSection(HumanReviewFindingOptions.SectionPath));
        services.Configure<FindingPayloadRemediationOptions>(configuration.GetSection(FindingPayloadRemediationOptions.SectionPath));
        services.PostConfigure<FindingPayloadRemediationOptions>(static o => o.Normalize());
        services.Configure<InsightDensityGateOptions>(configuration.GetSection(InsightDensityGateOptions.SectionPath));
        services.Configure<ArchLucid.Application.Findings.OpenCommitmentFindingOptions>(
            configuration.GetSection(ArchLucid.Application.Findings.OpenCommitmentFindingOptions.SectionPath));
        services.Configure<ArchLucid.Application.Findings.PortfolioRecurrenceFindingOptions>(
            configuration.GetSection(ArchLucid.Application.Findings.PortfolioRecurrenceFindingOptions.SectionPath));
        services.AddScoped<ArchLucid.Application.Findings.IPortfolioRecurrenceFindingOptionsResolver,
            ArchLucid.Application.Findings.PortfolioRecurrenceFindingOptionsResolver>();
        services.AddScoped<Di.IPortfolioRecurrenceCurrentReviewIdentitySource,
            ArchLucid.Application.Findings.PortfolioRecurrenceCurrentReviewIdentitySource>();
        services.AddSingleton<IInsightDensityGate, DeterministicInsightDensityGate>();
        services.TryAddSingleton<IInsightDensityLlmJudge, NoOpInsightDensityLlmJudge>();

        RegisterPluginFindingEngines(services, configuration);

        services.AddScoped<ArchLucid.Decisioning.Services.Findings.IFindingsPolicyStampStage,
            ArchLucid.Decisioning.Services.Findings.FindingsPolicyStampStage>();
        services.AddScoped<ArchLucid.Decisioning.Services.Findings.IFindingsEngineInvokeStage,
            ArchLucid.Decisioning.Services.Findings.FindingsEngineInvokeStage>();
        services.AddScoped<ArchLucid.Decisioning.Services.Findings.IFindingsMergeAndGateStage,
            ArchLucid.Decisioning.Services.Findings.FindingsMergeAndGateStage>();
        services.AddScoped<ArchLucid.Decisioning.Services.Findings.IFindingsSnapshotEmitStage,
            ArchLucid.Decisioning.Services.Findings.FindingsSnapshotEmitStage>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IFindingsOrchestrator, Ds.FindingsOrchestrator>();
        services.AddScoped<Di.IFindingsOrchestrator>(static sp =>
            (Di.IFindingsOrchestrator)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IFindingsOrchestrator>());
        services.AddSingleton<Di.IFindingPayloadValidator, Ds.FindingPayloadValidator>();
        services.AddSingleton<IFeasibilityVerdictValidator, FeasibilityVerdictValidator>();
        services.AddSingleton<FeasibilityVerdictBuilder>();
        services.AddSingleton<IAuthorityFeasibilityVerdictComposer, AuthorityFeasibilityVerdictComposer>();
        services.TryAddScoped<Di.IFindingPayloadJsonCompletionClient, AgentCompletionClientFindingPayloadAdapter>();
        services.AddScoped<ITradeoffDetectionEngine, TradeoffDetectionEngine>();
        services.TryAddSingleton<IDecisionIntakeTrailProvider, NullDecisionIntakeTrailProvider>();
        services.AddSingleton<FindingConfidenceCalculator>();
        services.AddSingleton<IExplanationFaithfulnessChecker, ExplanationFaithfulnessChecker>();
        services.AddSingleton<Di.IDecisionRuleProvider, Dr.InMemoryDecisionRuleProvider>();
        services.AddScoped<Dm.TopologyManifestSectionPopulator>();
        services.AddScoped<Dm.SecurityManifestSectionPopulator>();
        services.AddScoped<Dm.CostManifestSectionPopulator>();
        services.AddScoped<Dm.RequirementsManifestSectionPopulator>();
        services.AddScoped<Dm.ComplianceManifestSectionPopulator>();
        services.AddScoped<Dm.PolicyManifestSectionPopulator>();
        services.AddScoped<Dm.CoverageManifestSectionPopulator>();
        services.AddScoped<Dm.ConstraintsManifestSectionPopulator>();
        services.AddScoped<Dm.ProvenanceManifestSectionPopulator>();
        services.AddScoped<Di.IGoldenManifestBuilder, Dm.DefaultGoldenManifestBuilder>();
        services.AddSingleton<Di.IGoldenManifestValidator, Ds.GoldenManifestValidator>();
        services.AddSingleton<IManifestHashService, Ds.ManifestHashService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IDecisionEngine, Ds.RuleBasedDecisionEngine>();
        services.AddScoped<Di.IDecisionEngine>(static sp =>
            (Di.IDecisionEngine)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IDecisionEngine>());
        services.AddSingleton<IProvenanceBuilder, ProvenanceBuilder>();
        services.AddScoped<IAuthorityCommitProjectionBuilder, Decisioning.Manifest.AuthorityCommitProjectionBuilder>();
        services.AddHostedService<FindingEngineRegistrationDistinctnessHostedService>();
    }

    private static void RegisterPluginFindingEngines(IServiceCollection services, IConfiguration configuration)
    {
        string? pluginDirectory = configuration["ArchLucid:FindingEngines:PluginDirectory"];
        ILogger logger = NullLoggerFactory.Instance.CreateLogger("FindingEnginePlugins");

        foreach (Type engineType in FindingEnginePluginDiscovery.Discover(pluginDirectory, logger))

            services.TryAddEnumerable(ServiceDescriptor.Scoped(typeof(Di.IFindingEngine), engineType));

    }
}
