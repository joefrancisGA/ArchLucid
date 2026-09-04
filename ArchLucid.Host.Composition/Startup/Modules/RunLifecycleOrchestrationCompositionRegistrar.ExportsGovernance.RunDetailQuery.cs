using ArchLucid.Application;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Configuration;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPackDryRun.Stages;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query.Stages;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Application.Search;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterExportsGovernanceRunDetailQuery(IServiceCollection services)
    {
        services.AddScoped<TechnologyLedgerRequestSeeder>();
        services.AddScoped<TechnologyLedgerEvidenceSeeder>();
        services.AddScoped<TechnologyLedgerTopologyProposalSeeder>();
        services.AddScoped<ITechnologyLedgerRunCommandService, TechnologyLedgerRunCommandService>();
        services.AddScoped<Application.Runs.Query.IRunLifecycleCommandService, Application.Runs.Query.RunLifecycleCommandService>();
        services.AddScoped<IRunDetailQueryService, RunDetailQueryService>();
        services.AddAuthorityRunDetailEnrichment();
        services.AddScoped<IAuthorityRunDetailOperatorEnricher, AuthorityRunDetailOperatorEnricher>();
        services.AddScoped<IAgentOutputQualityGateOptionsResolver, AgentOutputQualityGateOptionsResolver>();
        services.AddScoped<IInsightDensityGateOptionsResolver, InsightDensityGateOptionsResolver>();
        services.AddScoped<ITenantAgentOutputQualityGateModeService, TenantAgentOutputQualityGateModeService>();
        services.AddScoped<ITenantFindingEngineControlsService, TenantFindingEngineControlsService>();
        services.AddScoped<ITenantWorkOwnershipDeletePolicyService, TenantWorkOwnershipDeletePolicyService>();
        services.AddScoped<IWorkOwnershipDeleteAuthorizationService, WorkOwnershipDeleteAuthorizationService>();
        services.AddScoped<ICallerRoleAccessor, HttpCallerRoleAccessor>();
        services.AddScoped<IWorkspaceModelExecutionProfileService, WorkspaceModelExecutionProfileService>();
        services.AddScoped<IWorkspaceAllowedEngineSetService, WorkspaceAllowedEngineSetService>();
        services.AddScoped<IModelExecutionProfileResolver, ModelExecutionProfileResolver>();
        services.AddScoped<IReviewModelAliasResolver, ReviewModelAliasResolver>();
        services.AddScoped<IAgentModelCatalogEvaluationRecorder, AgentModelCatalogEvaluationRecorder>();
        services.AddScoped<IFaithfulnessHarnessSummaryReader, RepoFaithfulnessHarnessSummaryReader>();
        services.AddScoped<IAgentModelCatalogFaithfulnessHarnessImporter, AgentModelCatalogFaithfulnessHarnessImporter>();
        services.AddScoped<IExternalSubprocessorEngineAcknowledgmentService, ExternalSubprocessorEngineAcknowledgmentService>();
        services.AddScoped<IFeaturedCompletedSampleService, FeaturedCompletedSampleService>();
        services.AddScoped<IPilotRunDeltaComputer, PilotRunDeltaComputer>();
        services.AddScoped<IRecentPilotRunDeltasService, RecentPilotRunDeltasService>();
        services.AddScoped<IPolicyPackDryRunLoadStage, PolicyPackDryRunLoadStage>();
        services.AddScoped<IPolicyPackDryRunRedactAuditStage, PolicyPackDryRunRedactAuditStage>();
        services.AddScoped<IPolicyPackDryRunService, PolicyPackDryRunService>();
        services.AddScoped<IPolicyPackGovernanceDryRunService, PolicyPackGovernanceDryRunService>();
        services.AddSingleton<IPolicyPackSchemaKeysService, PolicyPackSchemaKeysService>();
        services.AddScoped<IPolicyPackContentAuthoringValidationService, PolicyPackContentAuthoringValidationService>();
        services.AddSingleton<IPolicyPackRuleTemplatesService, PolicyPackRuleTemplatesService>();
        services.AddScoped<ILlmMonthlyTenantDollarBudgetStatusService, LlmMonthlyTenantDollarBudgetStatusService>();
        services.AddScoped<IReferenceEvidenceAdminExportService, ReferenceEvidenceAdminExportService>();
        services.AddScoped<IGlobalSearchService, GlobalSearchService>();
        services.AddScoped<ICustomRoleService, CustomRoleService>();
        services.AddScoped<ICustomRolePermissionEvaluator, CustomRolePermissionEvaluator>();
    }
}
