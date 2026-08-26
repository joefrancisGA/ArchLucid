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
        IScopeContextProvider? scopeContextProvider = null)
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
            : effectiveRequest.RunId.Trim();

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

            if (!string.IsNullOrWhiteSpace(effectiveRequest.RunId))
                baselineKnowledgeModel = await TryLoadExistingModelAsync(tenantId, runId, cancellationToken);

            cacheManifest = ReviewCacheManifestBuilder.Build(effectiveRequest, baselineKnowledgeModel);

            if (_reviewResultCache.TryGet(cacheManifest, out ClosedLoopReasoningResult? cached)
                && cached is not null)
            {
                cached.CacheHit = true;
                cached.CacheReuseReason = cacheManifest.ReuseReason ?? "dependency-manifest-match";
                ArchitectureIntelligenceBudgetResultApplier.Apply(cached, budget);
                ClosedLoopCacheHitPublishGuard.ApplyCacheHitPolicy(effectiveRequest, runId, cached);

                return cached;
            }
        }

        ArchitectureKnowledgeModel model;
        List<string> storedArtifactIds = [];

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

            if (effectiveRequest.SourceTexts.Count > 0)
            {
                await AppendSourceTextsToModelAsync(model, effectiveRequest, tenantId, cancellationToken);
            }
        }
        else
        {
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
            ProductFindings = ArchitectureIntelligenceProductBridge.ToFindings(
                publishDecision.PublishableFindings,
                validationByFindingId),
            ProductRecommendations = ArchitectureIntelligenceProductBridge.ToRecommendationRecords(
                publishDecision.PublishableRecommendations,
                publishDecision.PublishableFindings,
                tenantId,
                workspaceId,
                projectId,
                runId),
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

        if (cacheManifest is not null)
        {
            _reviewResultCache.Set(cacheManifest, result);

            if (!string.IsNullOrWhiteSpace(effectiveRequest.RunId))
            {
                ReviewCacheDependencyManifest postSaveManifest =
                    ReviewCacheManifestBuilder.Build(effectiveRequest, model);

                if (!string.Equals(
                        postSaveManifest.ContentHash,
                        cacheManifest.ContentHash,
                        StringComparison.Ordinal))
                {
                    _reviewResultCache.Set(postSaveManifest, result);
                }
            }
        }

        return result;
    }
}
