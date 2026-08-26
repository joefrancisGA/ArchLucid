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

        ReviewCacheDependencyManifest contentManifest =
            ReviewCacheManifestBuilder.Build(effectiveRequest, existing, ledgerEntries);

        using IDisposable pinScope = _reviewResultCache.PinScope(continueManifest, contentManifest);

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
                ct),
            cancellationToken);

        return FinalizeCoalescedReviewResult(
            sharedContinue,
            effectiveRequest,
            runId,
            budget);
    }

    private async Task<ClosedLoopReasoningResult> CoalesceReviewCacheMissAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest cacheManifest,
        CancellationToken cancellationToken)
    {
        if (!effectiveRequest.PublishToProduct
            && _reviewResultCache.TryGet(cacheManifest, out ClosedLoopReasoningResult? cached)
            && cached is not null)
        {
            cached.CacheHit = true;
            cached.CacheReuseReason = cacheManifest.ReuseReason ?? "dependency-manifest-match";

            return cached;
        }

        return await ExecuteLiveReviewAsync(
            effectiveRequest,
            tenantId,
            runId,
            budget,
            cacheManifest,
            ReviewCacheStorageKind.FullRun,
            cancellationToken);
    }

    private async Task<ClosedLoopReasoningResult> CoalesceContinueReviewCacheMissAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest continueManifest,
        CancellationToken cancellationToken)
    {
        if (!effectiveRequest.PublishToProduct
            && _reviewResultCache.TryGet(continueManifest, out ClosedLoopReasoningResult? cached)
            && cached is not null)
        {
            cached.CacheHit = true;
            cached.CacheReuseReason = continueManifest.ReuseReason ?? "dependency-manifest-match";

            return cached;
        }

        return await ExecuteLiveReviewAsync(
            effectiveRequest,
            tenantId,
            runId,
            budget,
            continueManifest,
            ReviewCacheStorageKind.ContinueFromExistingRun,
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

        bool isReviewCacheHit = reviewCacheHit?.IsReviewCacheHit == true || shared.CacheHit;

        if (isReviewCacheHit)
        {
            isolated.CacheHit = true;
            isolated.CacheReuseReason = reviewCacheHit?.ReuseReason
                ?? shared.CacheReuseReason
                ?? "dependency-manifest-match";
        }

        if (!effectiveRequest.PublishToProduct
            && (isReviewCacheHit || shared.PublishedToProduct))
            ClosedLoopCacheHitPublishGuard.ApplyAnalysisOnlyCoalescedIsolation(effectiveRequest, isolated);

        string policyRunId = string.IsNullOrWhiteSpace(effectiveRequest.RunId)
            ? isolated.RunId ?? runId
            : runId;

        if (ClosedLoopCacheHitPublishGuard.ShouldApplyCacheHitPolicyOnCoalescedResult(
                effectiveRequest,
                policyRunId,
                isolated))
        {
            ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(effectiveRequest, policyRunId, isolated);
        }

        return isolated;
    }
}
