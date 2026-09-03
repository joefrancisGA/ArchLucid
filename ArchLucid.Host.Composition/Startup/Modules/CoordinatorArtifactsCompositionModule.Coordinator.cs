using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.QuickScan;
using ArchLucid.Decisioning.Advisory.Analysis;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Reads;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class CoordinatorArtifactsCompositionModule
{
    // TB-305 / ADR 0042 (decision D): DecisionEngineV2, IDecisionNodeRepository, and DecisionNodeManifestMerger are LIVE
    // authority-pipeline components (consumed by AuthorityDrivenArchitectureRunCommitOrchestrator), not vestigial coordinator
    // primitives. The legacy coordinator repository family was deleted in ADR 0030 PR A3; this registration is authority-side.
    private static void RegisterCoordinatorAuthorityAndRepositories(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IArchitectureRunAuthorityCoordination, ArchitectureRunAuthorityCoordination>();
        services.AddSchemaValidation(configuration);
        services.AddScoped<DecisionMergeInputGate>();
        services.AddScoped<AgentProposalManifestMerger>();
        services.AddScoped<DecisionNodeManifestMerger>();
        services.AddScoped<ManifestGovernanceMerger>();
        services.AddScoped<IDecisionEngineService, DecisionEngineService>();
        services.AddScoped<IDecisionEngineV2, DecisionEngineV2>();
        services.AddSingleton<IComparisonService, ComparisonService>();
        services.AddSingleton<IImprovementSignalAnalyzer, ImprovementSignalAnalyzer>();
        services.AddSingleton<IAdaptiveRecommendationScorer, AdaptiveRecommendationScorer>();
        services.AddSingleton<IRecommendationLearningAnalyzer, RecommendationLearningAnalyzer>();
        services.AddSingleton<IRecommendationGenerator, RecommendationGenerator>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService, ImprovementAdvisorService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService>(sp => (ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService>());

        ArchLucidOptions storageOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);
        RegisterCoordinatorRepositories(services, storageOptions);
    }

    private static void RegisterCoordinatorRepositories(IServiceCollection services, ArchLucidOptions storageOptions)
    {
        // ADR 0030 PR A3 (2026-04-24): ICoordinatorGoldenManifestRepository and ICoordinatorDecisionTraceRepository
        // were deleted along with their concretes (InMemoryCoordinator*, GoldenManifestRepository, DecisionTraceRepository).
        // dbo.GoldenManifestVersions is gone (PR A4 / migration 111); decision traces are persisted via the
        // Authority FK chain (dbo.AuthorityDecisionTraces). The unified reader stays scoped (now authority-only).
        if (ArchLucidOptions.EffectiveIsInMemory(storageOptions.StorageProvider))
        {
            services.AddSingleton<IArchitectureRequestRepository, InMemoryArchitectureRequestRepository>();
            services.AddSingleton<IArchitectureRunIdempotencyRepository, InMemoryArchitectureRunIdempotencyRepository>();
            services.AddSingleton<ICommitRunIdempotencyRepository, InMemoryCommitRunIdempotencyRepository>();
            services.AddSingleton<IIdempotencyRecordRepository, InMemoryIdempotencyRecordRepository>();
            services.AddSingleton<IProjectRoleAssignmentRepository, InMemoryProjectRoleAssignmentRepository>();
            services.AddSingleton<IAgentTaskRepository, InMemoryAgentTaskRepository>();
            services.AddSingleton<IAgentResultEnrichmentRepository, InMemoryAgentResultEnrichmentRepository>();
            services.AddSingleton<IAgentResultRepository, InMemoryAgentResultRepository>();
            services.AddSingleton<IAgentEvaluationRepository, InMemoryAgentEvaluationRepository>();
            services.AddSingleton<IDecisionNodeRepository, InMemoryDecisionNodeRepository>();
            services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
            services.AddSingleton<IEvidenceBundleRepository, InMemoryEvidenceBundleRepository>();
            services.AddSingleton<IAgentEvidencePackageRepository, InMemoryAgentEvidencePackageRepository>();
            services.AddSingleton<IAgentExecutionTraceRepository, InMemoryAgentExecutionTraceRepository>();
            services.AddSingleton<ITechnologyLedgerRepository, InMemoryTechnologyLedgerRepository>();
            services.AddSingleton<ICoverageAssignmentRepository, InMemoryCoverageAssignmentRepository>();
            services.AddSingleton<IAgentOutputEvaluationResultRepository, NoOpAgentOutputEvaluationResultRepository>();
            services.AddSingleton<IAgentOutputEvaluationRepository, NoOpAgentOutputEvaluationRepository>();
            services.AddSingleton<IPromptVariantStatsRepository, NoOpPromptVariantStatsRepository>();
            services.AddSingleton<IAgentConfidenceCalibrationSampleRepository, NoOpAgentConfidenceCalibrationSampleRepository>();
            services.AddSingleton<ITenantCuratedEvidenceRepository, NoOpTenantCuratedEvidenceRepository>();
            services.AddSingleton<InMemoryQuickScanGlobalBudgetReservationStore>();
            services.AddSingleton<IQuickScanGlobalBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanGlobalBudgetReservationStore>());
            services.AddSingleton<InMemoryRunScopedLlmBudgetReservationStore>();
            services.AddSingleton<IRunScopedLlmBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryRunScopedLlmBudgetReservationStore>());
            services.AddSingleton<InMemoryLlmMonthlyTenantBudgetReservationStore>();
            services.AddSingleton<ILlmMonthlyTenantBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryLlmMonthlyTenantBudgetReservationStore>());
            services.AddSingleton<InMemoryQuickScanDistributedConcurrencyStore>();
            services.AddSingleton<IQuickScanDistributedConcurrencyStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanDistributedConcurrencyStore>());
            services.AddSingleton<InMemoryQuickScanIdentityAbuseStore>();
            services.AddSingleton<IQuickScanIdentityAbuseStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanIdentityAbuseStore>());
            services.AddSingleton<InMemoryQuickScanSafetyOperationalStateStore>();
            services.AddSingleton<IQuickScanSafetyOperationalStateStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanSafetyOperationalStateStore>());
            services.AddSingleton<InMemoryQuickScanUsageRecordStore>();
            services.AddSingleton<IQuickScanUsageRecordStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanUsageRecordStore>());
            services.AddSingleton<IWizardIntakeDraftRepository, InMemoryWizardIntakeDraftRepository>();
            return;
        }

        services.AddScoped<IAgentEvaluationRepository, AgentEvaluationRepository>();
        services.AddScoped<IDecisionNodeRepository, DecisionNodeRepository>();
        services.AddScoped<IArchitectureRequestRepository, ArchitectureRequestRepository>();
        services.AddScoped<IArchitectureRunIdempotencyRepository, ArchitectureRunIdempotencyRepository>();
        services.AddScoped<ICommitRunIdempotencyRepository, CommitRunIdempotencyRepository>();
        services.AddScoped<IIdempotencyRecordRepository, IdempotencyRecordRepository>();
        services.AddSingleton<IQuickScanGlobalBudgetReservationStore, DapperQuickScanGlobalBudgetReservationStore>();
        services.AddSingleton<IQuickScanDistributedConcurrencyStore, DapperQuickScanDistributedConcurrencyStore>();
        services.AddSingleton<IQuickScanIdentityAbuseStore, DapperQuickScanIdentityAbuseStore>();
        services.AddSingleton<IQuickScanSafetyOperationalStateStore, DapperQuickScanSafetyOperationalStateStore>();
        services.AddSingleton<IQuickScanUsageRecordStore, DapperQuickScanUsageRecordStore>();
        services.AddSingleton<IRunScopedLlmBudgetReservationStore, DapperRunScopedLlmBudgetReservationStore>();
        services.AddSingleton<ILlmMonthlyTenantBudgetReservationStore, DapperLlmMonthlyTenantBudgetReservationStore>();
        services.AddScoped<IProjectRoleAssignmentRepository, ProjectRoleAssignmentRepository>();
        services.AddScoped<IAgentTaskRepository, AgentTaskRepository>();
        services.AddScoped<IAgentResultEnrichmentRepository, AgentResultEnrichmentRepository>();
        services.AddScoped<IAgentResultRepository, AgentResultRepository>();
        services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
        services.AddScoped<IEvidenceBundleRepository, EvidenceBundleRepository>();
        services.AddScoped<IAgentEvidencePackageRepository, AgentEvidencePackageRepository>();
        services.AddScoped<IAgentExecutionTraceRepository, AgentExecutionTraceRepository>();
        services.AddScoped<ITechnologyLedgerRepository, TechnologyLedgerRepository>();
        services.AddScoped<ICoverageAssignmentRepository, DapperCoverageAssignmentRepository>();
        services.AddScoped<IAgentOutputEvaluationResultRepository, AgentOutputEvaluationResultRepository>();
        services.AddScoped<IAgentOutputEvaluationRepository, AgentOutputEvaluationRepository>();
        services.AddScoped<IPromptVariantStatsRepository, SqlPromptVariantStatsRepository>();
        services.AddScoped<IAgentConfidenceCalibrationSampleRepository, AgentConfidenceCalibrationSampleRepository>();
        services.AddScoped<ITenantCuratedEvidenceRepository, TenantCuratedEvidenceRepository>();
        services.AddScoped<IWizardIntakeDraftRepository, DapperWizardIntakeDraftRepository>();
    }
}
