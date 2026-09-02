using ArchLucid.Application.ArchitectureIntelligence.Stages;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator : IClosedLoopArchitectureReasoningOrchestrator
{
    private readonly IClosedLoopExtractionStage _extractionStage;
    private readonly IClosedLoopInterviewStage _interviewStage;
    private readonly IClosedLoopReviewStage _reviewStage;
    private readonly IClosedLoopRecommendationStage _recommendationStage;
    private readonly IClosedLoopPublishStage _publishStage;
    private readonly IReviewResultCache _reviewResultCache;
    private readonly ClosedLoopContinueRunSingleFlight _continueRunSingleFlight;
    private readonly IArchitectureIntelligenceReviewTierBudgetGuard _tierBudgetGuard;
    private readonly ClosedLoopModelPersistenceHelper _persistenceHelper;

    public ClosedLoopArchitectureReasoningOrchestrator(
        IClosedLoopExtractionStage extractionStage,
        IClosedLoopInterviewStage interviewStage,
        IClosedLoopReviewStage reviewStage,
        IClosedLoopRecommendationStage recommendationStage,
        IClosedLoopPublishStage publishStage,
        IReviewResultCache reviewResultCache,
        IArchitectureIntelligenceReviewTierBudgetGuard tierBudgetGuard,
        ClosedLoopModelPersistenceHelper persistenceHelper,
        ClosedLoopContinueRunSingleFlight? continueRunSingleFlight = null)
    {
        _extractionStage = extractionStage ?? throw new ArgumentNullException(nameof(extractionStage));
        _interviewStage = interviewStage ?? throw new ArgumentNullException(nameof(interviewStage));
        _reviewStage = reviewStage ?? throw new ArgumentNullException(nameof(reviewStage));
        _recommendationStage = recommendationStage ?? throw new ArgumentNullException(nameof(recommendationStage));
        _publishStage = publishStage ?? throw new ArgumentNullException(nameof(publishStage));
        _reviewResultCache = reviewResultCache ?? throw new ArgumentNullException(nameof(reviewResultCache));
        _persistenceHelper = persistenceHelper ?? throw new ArgumentNullException(nameof(persistenceHelper));
        _continueRunSingleFlight = continueRunSingleFlight ?? new ClosedLoopContinueRunSingleFlight();
        _tierBudgetGuard = tierBudgetGuard ?? throw new ArgumentNullException(nameof(tierBudgetGuard));
    }

    public async Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ClosedLoopReasoningRequest effectiveRequest = ClosedLoopReasoningRequestSnapshot.Capture(request);

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
                baselineKnowledgeModel = await _persistenceHelper.TryLoadExistingModelAsync(tenantId, runId, cancellationToken);
                baselineLedgerEntries = await _persistenceHelper.TryLoadLedgerEntriesAsync(runId, cancellationToken);
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
