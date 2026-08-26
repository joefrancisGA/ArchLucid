using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator
{
    private async Task<ClosedLoopReasoningResult> RunContinueFromExistingReviewAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        CancellationToken cancellationToken)
    {
        ArchitectureKnowledgeModel? existing = await TryLoadExistingModelAsync(tenantId, runId, cancellationToken);
        IReadOnlyList<TechnologyLedgerEntry>? ledgerEntries = await TryLoadLedgerEntriesAsync(runId, cancellationToken);
        ReviewCacheDependencyManifest continueManifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                effectiveRequest,
                tenantId,
                runId,
                existing,
                ledgerEntries);

        if (!effectiveRequest.PublishToProduct
            && _reviewResultCache.TryGet(continueManifest, out ClosedLoopReasoningResult? cachedContinue)
            && cachedContinue is not null)
        {
            return FinalizeCoalescedReviewResult(
                cachedContinue,
                effectiveRequest,
                runId,
                budget,
                new ReviewCacheHitMetadata(
                    true,
                    continueManifest.ReuseReason ?? "dependency-manifest-match"));
        }

        string continueInFlightKey = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            tenantId,
            runId,
            continueManifest,
            effectiveRequest.PublishToProduct);

        ClosedLoopReasoningResult sharedContinue = await _continueRunSingleFlight.CoalesceAsync(
            tenantId,
            runId,
            continueManifest,
            effectiveRequest.PublishToProduct,
            ct => CoalesceContinueReviewCacheMissAsync(
                effectiveRequest,
                tenantId,
                runId,
                budget,
                continueManifest,
                continueInFlightKey,
                ct),
            cancellationToken);

        ReviewCacheHitMetadata? continueCacheHit = null;

        if (_reviewResultCache.TryConsumeCoalesceLeaderReviewCacheHit(continueInFlightKey, out string? continueReuseReason))
            continueCacheHit = new ReviewCacheHitMetadata(true, continueReuseReason);

        return FinalizeCoalescedReviewResult(
            sharedContinue,
            effectiveRequest,
            runId,
            budget,
            continueCacheHit);
    }

    private async Task<ClosedLoopReasoningResult> CoalesceReviewCacheMissAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest cacheManifest,
        string inFlightKey,
        CancellationToken cancellationToken)
    {
        if (!effectiveRequest.PublishToProduct
            && _reviewResultCache.TryGet(cacheManifest, out ClosedLoopReasoningResult? cached)
            && cached is not null)
        {
            _reviewResultCache.MarkCoalesceLeaderReviewCacheHit(inFlightKey, cacheManifest.ReuseReason);

            return cached;
        }

        return await ExecuteLiveReviewAsync(
            effectiveRequest,
            tenantId,
            runId,
            budget,
            cacheManifest,
            cancellationToken);
    }

    private async Task<ClosedLoopReasoningResult> CoalesceContinueReviewCacheMissAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest continueManifest,
        string continueInFlightKey,
        CancellationToken cancellationToken)
    {
        if (!effectiveRequest.PublishToProduct
            && _reviewResultCache.TryGet(continueManifest, out ClosedLoopReasoningResult? cached)
            && cached is not null)
        {
            _reviewResultCache.MarkCoalesceLeaderReviewCacheHit(continueInFlightKey, continueManifest.ReuseReason);

            return cached;
        }

        return await ExecuteLiveReviewAsync(
            effectiveRequest,
            tenantId,
            runId,
            budget,
            continueManifest,
            cancellationToken);
    }

    private static ClosedLoopReasoningResult FinalizeCoalescedReviewResult(
        ClosedLoopReasoningResult shared,
        ClosedLoopReasoningRequest effectiveRequest,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheHitMetadata? reviewCacheHit = null)
    {
        ArgumentNullException.ThrowIfNull(shared);
        ArgumentNullException.ThrowIfNull(effectiveRequest);
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(budget);

        ClosedLoopReasoningResult isolated = ClosedLoopReasoningResultCloner.Clone(shared);
        ArchitectureIntelligenceBudgetResultApplier.Apply(isolated, budget);

        if (reviewCacheHit?.IsReviewCacheHit == true)
        {
            isolated.CacheHit = true;
            isolated.CacheReuseReason = reviewCacheHit.Value.ReuseReason ?? "dependency-manifest-match";
        }

        if (reviewCacheHit?.IsReviewCacheHit == true
            && !effectiveRequest.PublishToProduct)
            ClosedLoopCacheHitPublishGuard.ApplyAnalysisOnlyCoalescedIsolation(effectiveRequest, isolated);

        if (ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                effectiveRequest,
                runId,
                isolated))
        {
            ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(effectiveRequest, runId, isolated);
        }

        return isolated;
    }
}
