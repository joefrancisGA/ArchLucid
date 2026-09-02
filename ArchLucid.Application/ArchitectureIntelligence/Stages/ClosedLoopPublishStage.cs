using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class ClosedLoopPublishStage(
    IMustNotFailEnforcer mustNotFailEnforcer,
    ITrustPublishGate trustPublishGate,
    IReviewResultCache reviewResultCache,
    ClosedLoopArchitectureReasoningPostStageHooks postStageHooks,
    ClosedLoopModelPersistenceHelper persistenceHelper) : IClosedLoopPublishStage
{
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer =
        mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));

    private readonly ITrustPublishGate _trustPublishGate =
        trustPublishGate ?? throw new ArgumentNullException(nameof(trustPublishGate));

    private readonly IReviewResultCache _reviewResultCache =
        reviewResultCache ?? throw new ArgumentNullException(nameof(reviewResultCache));

    private readonly ClosedLoopArchitectureReasoningPostStageHooks _postStageHooks =
        postStageHooks ?? throw new ArgumentNullException(nameof(postStageHooks));

    private readonly ClosedLoopModelPersistenceHelper _persistenceHelper =
        persistenceHelper ?? throw new ArgumentNullException(nameof(persistenceHelper));

    public async Task<ClosedLoopReasoningResult> ExecuteAsync(
        ClosedLoopStageContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        ClosedLoopReasoningRequest effectiveRequest = context.EffectiveRequest;
        string tenantId = context.TenantId;
        string runId = context.RunId;
        ProgressiveInterviewState interview = context.Interview;

        context.GateFindings = BuildPublishGateFindings(
            context.Adversarial,
            context.AllFindings,
            context.ReReviewSubstantiation);

        context.MustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(
                context.GateFindings,
                context.Recommendations,
                await _persistenceHelper.TryLoadLedgerEntriesAsync(runId, cancellationToken))
            .ToList();

        context.PublishDecision = _trustPublishGate.Decide(
            context.GateFindings,
            context.Recommendations,
            context.ValidationResults,
            context.MustNotFailViolations);

        if (!interview.IsFramingComplete)
        {
            context.PublishDecision = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
                interview,
                context.PublishDecision);
        }

        if (context.ModelBeforeRecommendationApply is not null && context.PublishDecision.PublishBlocked)
        {
            context.Model = context.ModelBeforeRecommendationApply;
            context.Recommendations = [];
            context.ImpactResults = [];
            context.ModelDiffs = [];
            context.ReReview = null;
            context.ReReviewSubstantiation = null;

            if (context.ReReviewIntegrated)
            {
                ClosedLoopReReviewPublishIntegrator.RollbackIntegratorMutations(
                    context.AllFindingsCountBeforeIntegrate,
                    context.ValidationFindingIdsBeforeIntegrate,
                    context.AllFindings,
                    context.ValidationResults,
                    context.ValidationByFindingId);

                context.GateFindings = BuildPublishGateFindings(context.Adversarial, context.AllFindings, null);

                context.MustNotFailViolations = _mustNotFailEnforcer
                    .Evaluate(
                        context.GateFindings,
                        context.Recommendations,
                        await _persistenceHelper.TryLoadLedgerEntriesAsync(runId, cancellationToken))
                    .ToList();

                context.PublishDecision = _trustPublishGate.Decide(
                    context.GateFindings,
                    context.Recommendations,
                    context.ValidationResults,
                    context.MustNotFailViolations);

                if (!interview.IsFramingComplete)
                {
                    context.PublishDecision = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
                        interview,
                        context.PublishDecision);
                }
            }
        }

        if (!context.PublishDecision.PublishBlocked
            && effectiveRequest.PublishToProduct
            && context.ReReviewSubstantiation is not null
            && context.ReReview is not null)
        {
            await _postStageHooks.TryMergeAuthorityFindingsAsync(
                runId,
                context.ReReviewSubstantiation,
                context.ReReview,
                cancellationToken).ConfigureAwait(false);
        }

        bool persistModel = !context.PublishDecision.PublishBlocked || !context.HadPersistedModelForRun;

        if (persistModel)
            await _persistenceHelper.SaveModelAsync(runId, context.Model, cancellationToken);

        string workspaceId = effectiveRequest.WorkspaceId ?? tenantId;
        string projectId = effectiveRequest.ProjectId ?? tenantId;
        TrustPublishDecision publishDecision = context.PublishDecision;

        ClosedLoopReasoningResult result = new()
        {
            Model = context.Model,
            Interview = interview,
            SpecialistReviews = context.SpecialistReviews,
            Adversarial = context.Adversarial,
            Recommendations = context.Recommendations,
            ImpactResults = context.ImpactResults,
            ModelDiffs = context.ModelDiffs
                .Select(ArchitectureModelDiffPayloadSlimmer.WithoutModels)
                .ToList(),
            ReReview = context.ReReview,
            MustNotFailViolations = context.MustNotFailViolations,
            ValidationResults = context.ValidationResults,
            PublishBlocked = publishDecision.PublishBlocked,
            ReviewCompleteBlocked = !interview.IsFramingComplete,
            PublishBlockReasons = publishDecision.BlockReasons,
            IntegrityPassedFindingIds = publishDecision.IntegrityPassedFindingIds.ToList(),
            RunId = runId,
            ModelId = context.Model.ModelId,
            ProductFindings = effectiveRequest.PublishToProduct
                ? ArchitectureIntelligenceProductBridge.ToFindings(
                    publishDecision.PublishableFindings,
                    context.ValidationByFindingId)
                : [],
            ProductRecommendations = effectiveRequest.PublishToProduct
                ? ArchitectureIntelligenceProductBridge.ToRecommendationRecords(
                    publishDecision.PublishableRecommendations,
                    publishDecision.PublishableFindings,
                    tenantId,
                    workspaceId,
                    projectId,
                    runId)
                : [],
        };

        ArchitectureIntelligenceBudgetResultApplier.Apply(result, context.Budget);

        if (effectiveRequest.PublishToProduct && !publishDecision.PublishBlocked)
        {
            await _postStageHooks.ApplyProductPublishAsync(
                effectiveRequest,
                result,
                tenantId,
                runId,
                cancellationToken);
        }

        ReviewCacheDependencyManifest? cacheManifest = context.CacheManifest;
        ReviewCacheStorageKind? storageKind = context.StorageKind;

        if (cacheManifest is not null && persistModel && storageKind is not null)
        {
            IReadOnlyList<ArchLucid.Contracts.Persistence.TechnologyLedger.TechnologyLedgerEntry>? postSaveLedgerEntries =
                await _persistenceHelper.TryLoadLedgerEntriesAsync(runId, cancellationToken);

            ReviewCacheDependencyManifest storageManifest =
                storageKind == ReviewCacheStorageKind.ContinueFromExistingRun
                    ? ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                        effectiveRequest,
                        tenantId,
                        runId,
                        context.Model,
                        postSaveLedgerEntries)
                    : string.IsNullOrWhiteSpace(effectiveRequest.RunId)
                        ? cacheManifest
                        : ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                            effectiveRequest,
                            runId,
                            context.Model,
                            postSaveLedgerEntries);

            using IReviewResultCachePinScope storagePinScope = _reviewResultCache.PinScope(storageManifest);

            if (storagePinScope.IsPinned)
                _reviewResultCache.Set(storageManifest, result);
        }

        return result;
    }

    private static List<SpecialistReviewFinding> BuildPublishGateFindings(
        AdversarialReviewResult adversarial,
        List<SpecialistReviewFinding> allFindings,
        SpecialistFindingsSubstantiationResult? reReviewSubstantiation)
    {
        List<SpecialistReviewFinding> gateFindings = adversarial.SubstantiatedFindings.Count > 0
            ? adversarial.SubstantiatedFindings.ToList()
            : allFindings.ToList();

        if (reReviewSubstantiation is null)
            return gateFindings;

        HashSet<string> existingFindingIds = gateFindings
            .Select(finding => finding.FindingId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        foreach (SpecialistReviewFinding finding in reReviewSubstantiation.SubstantiatedFindings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId)
                || existingFindingIds.Contains(finding.FindingId))
            {
                continue;
            }

            gateFindings.Add(finding);
            existingFindingIds.Add(finding.FindingId);
        }

        return gateFindings;
    }
}
