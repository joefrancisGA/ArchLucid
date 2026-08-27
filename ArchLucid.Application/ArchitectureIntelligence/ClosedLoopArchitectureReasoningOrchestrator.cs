using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator : IClosedLoopArchitectureReasoningOrchestrator
{
    private const int ExtractionMaxConcurrent = 4;
    private const int SpecialistReviewMaxConcurrent = 3;
    private const int EvidenceValidationMaxConcurrent = 4;
    private readonly IImmutableSourceStore _sourceStore;
    private readonly IArchitectureOntologyService _ontologyService;
    private readonly IAsyncArchitectureExtractionService _extractionService;
    private readonly IProgressiveInterviewService _interviewService;
    private readonly IAsyncSpecialistReviewService _specialistReviewService;
    private readonly IEvidenceValidationPipeline _evidenceValidationPipeline;
    private readonly IAsyncAdversarialReviewService _adversarialReviewService;
    private readonly IAsyncArchitectureRecommendationEngine _recommendationEngine;
    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer;
    private readonly IArchitectureModelDiffApplier _modelDiffApplier;
    private readonly IIncrementalReReviewService _incrementalReReviewService;
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer;
    private readonly ITrustPublishGate _trustPublishGate;
    private readonly IReviewResultCache _reviewResultCache;
    private readonly ClosedLoopContinueRunSingleFlight _continueRunSingleFlight;
    private readonly IArchitectureIntelligenceReviewTierBudgetGuard _tierBudgetGuard;
    private readonly ClosedLoopArchitectureReasoningPostStageHooks _postStageHooks;
    private readonly IArchitectureIntelligencePersistence? _persistence;
    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess;
    private readonly ITechnologyLedgerRepository? _technologyLedgerRepository;
    private readonly IScopeContextProvider? _scopeContextProvider;

    public ClosedLoopArchitectureReasoningOrchestrator(
        IImmutableSourceStore sourceStore,
        IArchitectureOntologyService ontologyService,
        IAsyncArchitectureExtractionService extractionService,
        IProgressiveInterviewService interviewService,
        IAsyncSpecialistReviewService specialistReviewService,
        IEvidenceValidationPipeline evidenceValidationPipeline,
        IAsyncAdversarialReviewService adversarialReviewService,
        IAsyncArchitectureRecommendationEngine recommendationEngine,
        IChangeImpactAnalyzer changeImpactAnalyzer,
        IArchitectureModelDiffApplier modelDiffApplier,
        IIncrementalReReviewService incrementalReReviewService,
        IMustNotFailEnforcer mustNotFailEnforcer,
        ITrustPublishGate trustPublishGate,
        IReviewResultCache reviewResultCache,
        IArchitectureIntelligenceReviewTierBudgetGuard tierBudgetGuard,
        ClosedLoopArchitectureReasoningPostStageHooks postStageHooks,
        IArchitectureIntelligencePersistence? persistence = null,
        IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
        ITechnologyLedgerRepository? technologyLedgerRepository = null,
        IScopeContextProvider? scopeContextProvider = null,
        ClosedLoopContinueRunSingleFlight? continueRunSingleFlight = null)
    {
        _sourceStore = sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));
        _ontologyService = ontologyService ?? throw new ArgumentNullException(nameof(ontologyService));
        _extractionService = extractionService ?? throw new ArgumentNullException(nameof(extractionService));
        _interviewService = interviewService ?? throw new ArgumentNullException(nameof(interviewService));
        _specialistReviewService = specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));
        _evidenceValidationPipeline = evidenceValidationPipeline ?? throw new ArgumentNullException(nameof(evidenceValidationPipeline));
        _adversarialReviewService = adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));
        _recommendationEngine = recommendationEngine ?? throw new ArgumentNullException(nameof(recommendationEngine));
        _changeImpactAnalyzer = changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));
        _modelDiffApplier = modelDiffApplier ?? throw new ArgumentNullException(nameof(modelDiffApplier));
        _incrementalReReviewService = incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));
        _mustNotFailEnforcer = mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));
        _trustPublishGate = trustPublishGate ?? throw new ArgumentNullException(nameof(trustPublishGate));
        _reviewResultCache = reviewResultCache ?? throw new ArgumentNullException(nameof(reviewResultCache));
        _continueRunSingleFlight = continueRunSingleFlight ?? new ClosedLoopContinueRunSingleFlight();
        _tierBudgetGuard = tierBudgetGuard ?? throw new ArgumentNullException(nameof(tierBudgetGuard));
        _postStageHooks = postStageHooks ?? throw new ArgumentNullException(nameof(postStageHooks));
        _persistence = persistence;
        _knowledgeModelAccess = knowledgeModelAccess;
        _technologyLedgerRepository = technologyLedgerRepository;
        _scopeContextProvider = scopeContextProvider;
    }

    public async Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ClosedLoopReasoningRequest effectiveRequest = ClosedLoopReasoningRequestSnapshot.Capture(request);

        // Local effective ids: do not mutate the caller's request instance.
        string tenantId = RequireTenantId(effectiveRequest);
        string runId = string.IsNullOrWhiteSpace(effectiveRequest.RunId)
            ? Guid.NewGuid().ToString("N")
            : ClosedLoopRunIdNormalizer.NormalizeRequired(effectiveRequest.RunId);

        cancellationToken.ThrowIfCancellationRequested();

        ArchitectureIntelligenceBudgetDecision budget = await _tierBudgetGuard.EvaluateAsync(effectiveRequest, cancellationToken);

        if (!budget.Permitted)
        {
            return ArchitectureIntelligenceBudgetResultApplier.CreateRejected(runId, budget);
        }

        ReviewCacheDependencyManifest? cacheManifest = null;

        if (!effectiveRequest.ContinueFromExistingRun)
        {
            ArchitectureKnowledgeModel? baselineKnowledgeModel = null;
            IReadOnlyList<TechnologyLedgerEntry>? baselineLedgerEntries = null;

            if (!string.IsNullOrWhiteSpace(effectiveRequest.RunId))
            {
                baselineKnowledgeModel = await TryLoadExistingModelAsync(tenantId, runId, cancellationToken);
                baselineLedgerEntries = await TryLoadLedgerEntriesAsync(runId, cancellationToken);
            }

            cacheManifest = ReviewCacheManifestBuilder.Build(
                effectiveRequest,
                baselineKnowledgeModel,
                baselineLedgerEntries);

            using IReviewResultCachePinScope pinScope = !string.IsNullOrWhiteSpace(effectiveRequest.RunId)
                ? _reviewResultCache.PinScope(
                    cacheManifest,
                    ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                        effectiveRequest,
                        runId,
                        baselineKnowledgeModel,
                        baselineLedgerEntries))
                : _reviewResultCache.PinScope(cacheManifest);

            if (pinScope.IsPinned
                && !effectiveRequest.PublishToProduct
                && _reviewResultCache.TryGet(cacheManifest, out ClosedLoopReasoningResult? cached)
                && cached is not null)
            {
                return FinalizeCoalescedReviewResult(
                    CreateCoalescedCacheHitResult(
                        cached,
                        cacheManifest),
                    effectiveRequest,
                    runId,
                    budget);
            }

            ClosedLoopReasoningResult shared = await _reviewResultCache.CoalesceAsync(
                cacheManifest,
                ct => CoalesceReviewCacheMissAsync(
                    effectiveRequest,
                    tenantId,
                    runId,
                    budget,
                    cacheManifest,
                    ct),
                cancellationToken,
                effectiveRequest.PublishToProduct);

            return FinalizeCoalescedReviewResult(
                shared,
                effectiveRequest,
                runId,
                budget);
        }

        return await RunContinueFromExistingReviewAsync(
            effectiveRequest,
            tenantId,
            runId,
            budget,
            cancellationToken);
    }
}
