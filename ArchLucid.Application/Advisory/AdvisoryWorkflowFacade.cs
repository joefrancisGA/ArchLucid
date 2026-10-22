using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryWorkflowFacade(
    IAuthorityQueryService authorityQueryService,
    IComparisonService comparisonService,
    IImprovementAdvisorService improvementAdvisorService,
    IScopeContextProvider scopeProvider,
    IRecommendationWorkflowService recommendationWorkflowService,
    IRecommendationRepository recommendationRepository,
    IRunRepository runRepository,
    IManifestHashService manifestHashService,
    IRecommendationImproveLoopCoordinator? recommendationImproveLoopCoordinator = null,
    IRecommendationImproveLoopEvidencePersister? recommendationImproveLoopEvidencePersister = null)
    : IAdvisoryWorkflowFacade
{
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IComparisonService _comparisonService =
        comparisonService ?? throw new ArgumentNullException(nameof(comparisonService));
    private readonly IImprovementAdvisorService _improvementAdvisorService =
        improvementAdvisorService ?? throw new ArgumentNullException(nameof(improvementAdvisorService));
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly IRecommendationWorkflowService _recommendationWorkflowService =
        recommendationWorkflowService ?? throw new ArgumentNullException(nameof(recommendationWorkflowService));
    private readonly IRecommendationRepository _recommendationRepository =
        recommendationRepository ?? throw new ArgumentNullException(nameof(recommendationRepository));
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IRecommendationImproveLoopCoordinator? _recommendationImproveLoopCoordinator =
        recommendationImproveLoopCoordinator;
    private readonly IRecommendationImproveLoopEvidencePersister? _recommendationImproveLoopEvidencePersister =
        recommendationImproveLoopEvidencePersister;
}
