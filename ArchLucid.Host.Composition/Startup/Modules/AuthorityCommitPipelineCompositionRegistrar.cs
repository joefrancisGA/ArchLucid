// Authority-commit pipeline composition registrations (extracted from PipelineCompositionModule).

using ArchLucid.Application.Common;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Application.Runs.Orchestration.Events;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Application.Support;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Runs;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Http;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Pre-commit governance gates, authority commit stages, and commit orchestrator registrations.
/// </summary>
internal static class AuthorityCommitPipelineCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IActorContext, HttpActorContext>();
        services.AddScoped<IBaselineMutationAuditService, BaselineMutationAuditService>();
        services.Configure<PreCommitGovernanceGateOptions>(
            configuration.GetSection(PreCommitGovernanceGateOptions.SectionPath));
        services.Configure<TechnologyConsistencyFindingEngineOptions>(
            configuration.GetSection(TechnologyConsistencyFindingEngineOptions.SectionPath));
        services.Configure<FindingEvidenceLinkageFindingEngineOptions>(
            configuration.GetSection(FindingEvidenceLinkageFindingEngineOptions.SectionPath));
        services.AddScoped<IFindingEvidenceLinkageFindingEngine, FindingEvidenceLinkageFindingEngine>();
        services.Configure<TechnologyLedgerArtifactLintOptions>(
            configuration.GetSection(TechnologyLedgerArtifactLintOptions.SectionPath));
        services.Configure<AuthorityCommitSchemaValidationOptions>(
            configuration.GetSection(AuthorityCommitSchemaValidationOptions.SectionPath));
        services.Configure<ArchitectureRunCreateOptions>(
            configuration.GetSection(ArchitectureRunCreateOptions.SectionPath));
        services.AddScoped<IPreCommitGovernanceGate, PreCommitGovernanceGate>();
        services.AddScoped<IPreFinalizeChecklistService, PreFinalizeChecklistService>();
        services.AddScoped<IFindingMergeConflictResolutionService, FindingMergeConflictResolutionService>();
        services.AddScoped<ITechnologyConsistencyFindingEngine, TechnologyConsistencyFindingEngine>();
        services.AddScoped<ICommittedEffectiveGovernanceSnapshotCapturer, CommittedEffectiveGovernanceSnapshotCapturer>();
        services.AddScoped<ICommittedReviewStandardsSnapshotCapturer, CommittedReviewStandardsSnapshotCapturer>();
        services.AddScoped<IManifestFinalizationService, ManifestFinalizationService>();
        services.AddSingleton<DefaultRequestContentSafetyPrecheck>();
        services.AddSingleton<LlmSemanticAdmissionGate>();
        services.AddSingleton<IRequestContentSafetyPrecheck>(sp => new CompositeRequestContentSafetyPrecheck(
        [
            sp.GetRequiredService<DefaultRequestContentSafetyPrecheck>(),
            sp.GetRequiredService<LlmSemanticAdmissionGate>()
        ]));
        services.Configure<EvidenceInjectionMitigationOptions>(
            configuration.GetSection(EvidenceInjectionMitigationOptions.SectionPath));
        services.AddSingleton<IEvidencePackageInjectionMitigator, EvidencePackageInjectionMitigator>();
        services.Configure<SupportBundleOptions>(configuration.GetSection(SupportBundleOptions.SectionPath));
        services.AddSingleton<IRunStateTransitionService, RunStateTransitionService>();
        services.AddScoped<PostCommitProjectionEnqueuer>();
        services.Configure<GraphMergeRuntimeInvariantOptions>(
            configuration.GetSection(GraphMergeRuntimeInvariantOptions.SectionName));
        services.AddScoped<IGraphMergeRuntimeInvariantReporter, GraphMergeRuntimeInvariantReporter>();
        services.AddScoped<IDecisionEngineV2NodeMaterializer, DecisionEngineV2NodeMaterializer>();
        services.AddScoped<IAuthorityCommitGovernanceStage, AuthorityCommitGovernanceStage>();
        services.AddScoped<IAuthorityCommitDecisionMaterializationStage, AuthorityCommitDecisionMaterializationStage>();
        services.AddScoped<IAuthorityCommitIdempotencyHandler, AuthorityCommitIdempotencyHandler>();
        services.AddScoped<IAuthorityCommitFailureRecorder, AuthorityCommitFailureRecorder>();
        services.AddScoped<IAuthorityCommitPersistenceStage, AuthorityCommitPersistenceStage>();
        services.AddScoped<IAuthorityPipelineStagePersistence, AuthorityPipelineStagePersistence>();
        services.AddScoped<AuthorityPipelineStageContextHydrator>();
        services.AddScoped<IAuthorityPipelineContextIngestionStage, AuthorityPipelineContextIngestionStage>();
        services.AddScoped<IAuthorityPipelineGraphStage, AuthorityPipelineGraphStage>();
        services.AddScoped<IAuthorityPipelineFindingsStage, AuthorityPipelineFindingsStage>();
        services.AddScoped<IAuthorityPipelineDecisioningStage, AuthorityPipelineDecisioningStage>();
        services.AddScoped<IAuthorityPipelineArtifactsStage, AuthorityPipelineArtifactsStage>();
        services.AddScoped<IArchitectureRunCommitOrchestrator, AuthorityDrivenArchitectureRunCommitOrchestrator>();
        services.AddScoped<ICommitPipelineManifestReuseService, CommitPipelineManifestReuseService>();
        services.AddScoped<ICommitOutputIntegrityService, CommitOutputIntegrityService>();
        services.AddScoped<IReviewCompletedEventHandler, ReviewCompletedEventHandler>();
    }
}
