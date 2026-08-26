using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator
{
    private async Task<ClosedLoopReasoningResult> ExecuteLiveReviewAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest? cacheManifest,
        ReviewCacheStorageKind? storageKind,
        CancellationToken cancellationToken)
    {
        ArchitectureKnowledgeModel model;
        List<string> storedArtifactIds = [];
        bool hadPersistedModelForRun = false;

        if (effectiveRequest.ContinueFromExistingRun
            && !string.IsNullOrWhiteSpace(runId))
        {
            ArchitectureKnowledgeModel? existing = await TryLoadExistingModelAsync(tenantId, runId, cancellationToken);

            if (existing is null)
            {
                throw new InvalidOperationException(
                    $"No ArchitectureIntelligence model found for run '{runId}'.");
            }

            model = ArchitectureKnowledgeModelCloner.Clone(existing);
            hadPersistedModelForRun = true;

            if (effectiveRequest.SourceTexts.Count > 0)
            {
                await AppendSourceTextsToModelAsync(model, effectiveRequest, tenantId, cancellationToken);
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(effectiveRequest.RunId))
            {
                ArchitectureKnowledgeModel? existingForRun =
                    await TryLoadExistingModelAsync(tenantId, runId, cancellationToken);

                hadPersistedModelForRun = existingForRun is not null;
            }

            storedArtifactIds = await StoreSourcesAsync(effectiveRequest, tenantId, cancellationToken);
            model = await BuildModelAsync(effectiveRequest, tenantId, runId, storedArtifactIds, cancellationToken);
        }

        model.RunId = runId;
        model.DeclaredPriorities = effectiveRequest.DeclaredPriorities.Count > 0
            ? effectiveRequest.DeclaredPriorities.ToList()
            : model.DeclaredPriorities.ToList();

        ProgressiveInterviewState interview = _interviewService.BuildFramingState(model, effectiveRequest.SourceTexts);

        if (effectiveRequest.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(model, interview, effectiveRequest.FramingAnswers);
        }

        List<SpecialistReviewResult> specialistReviews = await RunSpecialistReviewsAsync(
            model,
            effectiveRequest.DeclaredPriorities,
            cancellationToken);

        if (!interview.IsFramingComplete)
        {
            model.IsProvisionalSynthesis = true;
            SpecialistReviewProvisionalGating.ApplyWhileFramingIncomplete(specialistReviews);
        }
        else
        {
            model.IsProvisionalSynthesis = false;
        }

        List<SpecialistReviewFinding> allFindings = specialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions(specialistReviews)
            .ToList();

        if (effectiveRequest.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(model, interview, effectiveRequest.FramingAnswers);
        }

        // No fallback artifact/quote injection — stage-1 must fail closed when citations are absent.
        List<EvidenceValidationResult> validationResults = await ValidateFindingsAsync(allFindings, cancellationToken);

        Dictionary<string, EvidenceValidationResult> validationByFindingId = validationResults
            .ToDictionary(result => result.FindingId, StringComparer.Ordinal);

        foreach (SpecialistReviewFinding finding in allFindings)
        {
            if (!validationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation))
            {
                continue;
            }

            EvidenceSupportTierResolver.ApplyToFinding(finding, validation);
        }

        HashSet<string> integrityPassedIds = validationResults
            .Where(result => result.OverallPassedIntegrity)
            .Select(result => result.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        AdversarialReviewResult adversarial = await _adversarialReviewService.ReviewAsync(
            allFindings,
            integrityPassedIds,
            cancellationToken);

        int challengeQuestionIndex = interview.EvidenceDrivenQuestions.Count;

        foreach (string openQuestion in _adversarialReviewService.ToOpenQuestions(adversarial))
        {
            bool alreadyPresent = interview.EvidenceDrivenQuestions
                .Any(question => string.Equals(question.Prompt, openQuestion, StringComparison.Ordinal));

            if (alreadyPresent)
            {
                continue;
            }

            challengeQuestionIndex++;
            interview.EvidenceDrivenQuestions.Add(new FramingQuestion
            {
                QuestionId = $"adversarial-{challengeQuestionIndex}",
                Prompt = openQuestion,
                IsAnswered = false,
                Source = FramingQuestionSource.EvidenceDriven,
            });
        }

        MergeAdversarialChallengesIntoModel(model, adversarial);

        // Recommendations are built from integrity-passed substantiated findings when available.
        IReadOnlyList<SpecialistReviewFinding> recommendationSourceFindings =
            adversarial.SubstantiatedFindings.Count > 0
                ? adversarial.SubstantiatedFindings
                : allFindings;

        List<ArchitectureRecommendation> recommendations = [];
        List<ChangeImpactResult> impactResults = [];
        List<ArchitectureModelDiff> modelDiffs = [];
        IncrementalReReviewResult? reReview = null;
        SpecialistFindingsSubstantiationResult? reReviewSubstantiation = null;
        ArchitectureKnowledgeModel? modelBeforeRecommendationApply = null;
        int allFindingsCountBeforeIntegrate = allFindings.Count;
        HashSet<string> validationFindingIdsBeforeIntegrate = validationResults
            .Select(result => result.FindingId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);
        bool reReviewIntegrated = false;

        if (interview.IsFramingComplete)
        {
            recommendations = (await _recommendationEngine
                .BuildRecommendationsAsync(
                    model,
                    recommendationSourceFindings,
                    effectiveRequest.DeclaredPriorities,
                    cancellationToken))
                .ToList();

            if (recommendations.Count > 0)
            {
                modelBeforeRecommendationApply = ArchitectureKnowledgeModelCloner.Clone(model);
                allFindingsCountBeforeIntegrate = allFindings.Count;
                validationFindingIdsBeforeIntegrate = validationResults
                    .Select(result => result.FindingId)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .ToHashSet(StringComparer.Ordinal);

                ClosedLoopRecommendationBatchApplyResult applied =
                    new ClosedLoopRecommendationBatchApplier(_modelDiffApplier, _changeImpactAnalyzer)
                        .Apply(model, recommendations);

                modelDiffs = applied.ModelDiffs;
                impactResults = applied.ImpactResults;
                model = applied.WorkingModel;

                reReview = await _incrementalReReviewService.ReReviewAsync(
                    model,
                    applied.Scope,
                    _specialistReviewService,
                    cancellationToken).ConfigureAwait(false);

                reReviewSubstantiation = await _postStageHooks.IntegrateReReviewFindingsAsync(
                    runId,
                    reReview,
                    allFindings,
                    validationResults,
                    validationByFindingId,
                    cancellationToken).ConfigureAwait(false);

                if (reReviewSubstantiation is not null)
                    reReviewIntegrated = true;
            }
        }

        List<SpecialistReviewFinding> gateFindings = BuildPublishGateFindings(
            adversarial,
            allFindings,
            reReviewSubstantiation);

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(
                gateFindings,
                recommendations,
                await TryLoadLedgerEntriesAsync(runId, cancellationToken))
            .ToList();

        TrustPublishDecision publishDecision = _trustPublishGate.Decide(
            gateFindings,
            recommendations,
            validationResults,
            mustNotFailViolations);

        if (!interview.IsFramingComplete)
        {
            publishDecision = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
                interview,
                publishDecision);
        }

        if (modelBeforeRecommendationApply is not null && publishDecision.PublishBlocked)
        {
            model = modelBeforeRecommendationApply;
            recommendations = [];
            impactResults = [];
            modelDiffs = [];
            reReview = null;
            reReviewSubstantiation = null;

            if (reReviewIntegrated)
            {
                ClosedLoopReReviewPublishIntegrator.RollbackIntegratorMutations(
                    allFindingsCountBeforeIntegrate,
                    validationFindingIdsBeforeIntegrate,
                    allFindings,
                    validationResults,
                    validationByFindingId);

                gateFindings = BuildPublishGateFindings(adversarial, allFindings, null);

                mustNotFailViolations = _mustNotFailEnforcer
                    .Evaluate(
                        gateFindings,
                        recommendations,
                        await TryLoadLedgerEntriesAsync(runId, cancellationToken))
                    .ToList();

                publishDecision = _trustPublishGate.Decide(
                    gateFindings,
                    recommendations,
                    validationResults,
                    mustNotFailViolations);

                if (!interview.IsFramingComplete)
                {
                    publishDecision = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
                        interview,
                        publishDecision);
                }
            }
        }

        if (!publishDecision.PublishBlocked
            && effectiveRequest.PublishToProduct
            && reReviewSubstantiation is not null
            && reReview is not null)
        {
            await _postStageHooks.TryMergeAuthorityFindingsAsync(
                runId,
                reReviewSubstantiation,
                reReview,
                cancellationToken).ConfigureAwait(false);
        }

        bool persistModel = !publishDecision.PublishBlocked || !hadPersistedModelForRun;

        if (persistModel)
            await SaveModelAsync(runId, model, cancellationToken);

        string workspaceId = effectiveRequest.WorkspaceId ?? tenantId;
        string projectId = effectiveRequest.ProjectId ?? tenantId;

        ClosedLoopReasoningResult result = new()
        {
            Model = model,
            Interview = interview,
            SpecialistReviews = specialistReviews,
            Adversarial = adversarial,
            Recommendations = recommendations,
            ImpactResults = impactResults,
            ModelDiffs = modelDiffs
                .Select(ArchitectureModelDiffPayloadSlimmer.WithoutModels)
                .ToList(),
            ReReview = reReview,
            MustNotFailViolations = mustNotFailViolations,
            ValidationResults = validationResults,
            PublishBlocked = publishDecision.PublishBlocked,
            ReviewCompleteBlocked = !interview.IsFramingComplete,
            PublishBlockReasons = publishDecision.BlockReasons,
            IntegrityPassedFindingIds = publishDecision.IntegrityPassedFindingIds.ToList(),
            RunId = runId,
            ModelId = model.ModelId,
            ProductFindings = effectiveRequest.PublishToProduct
                ? ArchitectureIntelligenceProductBridge.ToFindings(
                    publishDecision.PublishableFindings,
                    validationByFindingId)
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

        ArchitectureIntelligenceBudgetResultApplier.Apply(result, budget);

        if (effectiveRequest.PublishToProduct && !publishDecision.PublishBlocked)
        {
            await _postStageHooks.ApplyProductPublishAsync(
                effectiveRequest,
                result,
                tenantId,
                runId,
                cancellationToken);
        }

        if (cacheManifest is not null && persistModel && storageKind is not null)
        {
            IReadOnlyList<TechnologyLedgerEntry>? postSaveLedgerEntries =
                await TryLoadLedgerEntriesAsync(runId, cancellationToken);

            ReviewCacheDependencyManifest storageManifest =
                storageKind == ReviewCacheStorageKind.ContinueFromExistingRun
                    ? ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                        effectiveRequest,
                        tenantId,
                        runId,
                        model,
                        postSaveLedgerEntries)
                    : string.IsNullOrWhiteSpace(effectiveRequest.RunId)
                        ? cacheManifest
                        : ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                            effectiveRequest,
                            runId,
                            model,
                            postSaveLedgerEntries);

            using IDisposable storagePinScope = _reviewResultCache.PinScope(storageManifest);
            _reviewResultCache.Set(storageManifest, result);
        }

        return result;
    }
}
