// Draft-intake composition registrations (extracted from PipelineCompositionModule).

using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Application.Planning.Stages;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Application.Runs.Feasibility;
using ArchLucid.Core.Http;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Host.Core.Http;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Draft admission, branching, advisory-draft async ops, and intake parser registrations.
/// </summary>
internal static class DraftIntakeCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IDraftAdmissionGate, DraftAdmissionGate>();
        services.AddScoped<IQuestionSelectionEngine, QuestionSelectionEngine>();
        services.AddScoped<IDraftRequestProjector, DraftRequestProjector>();
        services.AddScoped<IPriorPackageSemanticMergeService, PriorPackageSemanticMergeService>();
        services.AddScoped<IDraftRequestCreateStage, DraftRequestCreateStage>();
        services.AddScoped<IPresenterIntakeTrailSyncService, PresenterIntakeTrailSyncService>();
        services.AddScoped<IDraftRequestMutateStage, DraftRequestMutateStage>();
        services.AddScoped<IDraftRequestDeleteStage, DraftRequestDeleteStage>();
        services.AddScoped<IDraftRequestCrudService, DraftRequestCrudService>();
        services.AddScoped<IDraftAdmissionService, DraftAdmissionService>();
        services.AddScoped<IDraftBranchingService, DraftBranchingService>();
        services.AddScoped<IDraftSnapshotCloningService, DraftSnapshotCloningService>();
        services.AddScoped<IDraftRequestService, DraftRequestService>();
        services.AddScoped<IDraftRequestApplicationFacade, DraftRequestApplicationFacade>();
        services.AddScoped<IDecisionReceiptService, DecisionReceiptService>();
        services.AddScoped<IDraftIntakeReaperService, DraftIntakeReaperService>();
        services.AddScoped<IDecisionIntakeTrailProvider, ArchitectureRequestIntakeTrailProvider>();
        services.AddScoped<IArchitectureRequestDraftSemanticUniquePass, ArchitectureRequestDraftSemanticUniquePass>();
        services.AddScoped<IBriefAssumptionEvidenceContradictionPass, BriefAssumptionEvidenceContradictionPass>();
        services.AddScoped<IArchitectureRequestDraftExtractStage, ArchitectureRequestDraftExtractStage>();
        services.AddScoped<IArchitectureRequestDraftNormalizeStage, ArchitectureRequestDraftNormalizeStage>();
        services.AddScoped<IArchitectureRequestDraftService, ArchitectureRequestDraftService>();
        services.AddSingleton<AdvisoryDraftOperationQueue>();
        services.AddScoped<IAdvisoryDraftOperationAcceptor, AdvisoryDraftOperationAcceptor>();
        services.AddHostedService<AdvisoryDraftOperationHostedService>();
        services.AddScoped<IArchitectureOverviewRewriteService, ArchitectureOverviewRewriteService>();
        services.AddScoped<IClarificationAnswerRephraseService, ClarificationAnswerRephraseService>();
        services.AddScoped<IStructuredBriefSuggestionExplainService, StructuredBriefSuggestionExplainService>();
        services.AddScoped<IChatIntakeParserService, ChatIntakeParserService>();
        services.AddHttpClient(GitTerraformContentFetcher.HttpClientName)
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IGitTerraformContentFetcher, GitTerraformContentFetcher>();
        services.AddScoped<IConnectorIntakeParserService, ConnectorIntakeParserService>();
        services.AddScoped<IArchitectureRequestIntakeFacade, ArchitectureRequestIntakeFacade>();
        ArchitectureRequestIntakeValidatorRegistration.Register(services);
        services.AddScoped<IPolicyPackDraftService, PolicyPackDraftService>();
        services.AddScoped<ICuratedRulesDocumentValidationService, CuratedRulesDocumentValidationService>();
        services.AddScoped<IPolicyPackGeneratorService, PolicyPackGeneratorService>();
    }
}
