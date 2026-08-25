using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopArchitectureReasoningOrchestrator : IClosedLoopArchitectureReasoningOrchestrator
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
    private readonly IArchitectureIntelligenceProductPublishService _productPublishService;
    private readonly IReviewResultCache _reviewResultCache;
    private readonly IArchitectureIntelligenceReviewTierBudgetGuard _tierBudgetGuard;
    private readonly IArchitectureIntelligencePersistence? _persistence;
    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess;
    private readonly ITechnologyLedgerRepository? _technologyLedgerRepository;
    private readonly IScopeContextProvider? _scopeContextProvider;
    private readonly IAuthorityFindingsSnapshotUpdater? _authorityFindingsSnapshotUpdater;
    private readonly ISpecialistFindingsSubstantiationService _specialistFindingsSubstantiationService;

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
        IArchitectureIntelligenceProductPublishService productPublishService,
        IReviewResultCache reviewResultCache,
        IArchitectureIntelligenceReviewTierBudgetGuard tierBudgetGuard,
        ISpecialistFindingsSubstantiationService specialistFindingsSubstantiationService,
        IArchitectureIntelligencePersistence? persistence = null,
        IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
        ITechnologyLedgerRepository? technologyLedgerRepository = null,
        IScopeContextProvider? scopeContextProvider = null,
        IAuthorityFindingsSnapshotUpdater? authorityFindingsSnapshotUpdater = null)
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
        _productPublishService = productPublishService ?? throw new ArgumentNullException(nameof(productPublishService));
        _reviewResultCache = reviewResultCache ?? throw new ArgumentNullException(nameof(reviewResultCache));
        _tierBudgetGuard = tierBudgetGuard ?? throw new ArgumentNullException(nameof(tierBudgetGuard));
        _specialistFindingsSubstantiationService = specialistFindingsSubstantiationService
            ?? throw new ArgumentNullException(nameof(specialistFindingsSubstantiationService));
        _persistence = persistence;
        _knowledgeModelAccess = knowledgeModelAccess;
        _technologyLedgerRepository = technologyLedgerRepository;
        _scopeContextProvider = scopeContextProvider;
        _authorityFindingsSnapshotUpdater = authorityFindingsSnapshotUpdater;
    }

    public async Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Local non-null copy: TenantId is optional on inbound HTTP bodies (scope-stamped).
        string tenantId = RequireTenantId(request);
        request.TenantId = tenantId;

        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            request.RunId = Guid.NewGuid().ToString("N");
        }

        ArchitectureIntelligenceBudgetDecision budget = await _tierBudgetGuard.EvaluateAsync(request, cancellationToken);

        if (!budget.Permitted)
        {
            return ArchitectureIntelligenceBudgetResultApplier.CreateRejected(request.RunId, budget);
        }

        ReviewCacheDependencyManifest? cacheManifest = null;

        if (!request.ContinueFromExistingRun)
        {
            cacheManifest = ReviewCacheManifestBuilder.Build(request);

            if (_reviewResultCache.TryGet(cacheManifest, out ClosedLoopReasoningResult? cached)
                && cached is not null)
            {
                cached.CacheHit = true;
                cached.CacheReuseReason = cacheManifest.ReuseReason ?? "dependency-manifest-match";
                ArchitectureIntelligenceBudgetResultApplier.Apply(cached, budget);
                ClosedLoopCacheHitPublishGuard.SuppressUnpublishedCacheHit(request, cached);

                return cached;
            }
        }

        ArchitectureKnowledgeModel model;
        List<string> storedArtifactIds = [];

        if (request.ContinueFromExistingRun
            && !string.IsNullOrWhiteSpace(request.RunId))
        {
            ArchitectureKnowledgeModel? existing = await TryLoadExistingModelAsync(tenantId, request.RunId, cancellationToken);

            if (existing is null)
            {
                throw new InvalidOperationException(
                    $"No ArchitectureIntelligence model found for run '{request.RunId}'.");
            }

            model = existing;
        }
        else
        {
            storedArtifactIds = await StoreSourcesAsync(request, cancellationToken);
            model = await BuildModelAsync(request, storedArtifactIds, cancellationToken);
        }

        model.RunId = request.RunId;
        model.DeclaredPriorities = request.DeclaredPriorities.Count > 0
            ? request.DeclaredPriorities.ToList()
            : model.DeclaredPriorities;

        ProgressiveInterviewState interview = _interviewService.BuildFramingState(model, request.SourceTexts);

        if (request.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(model, interview, request.FramingAnswers);
        }

        List<SpecialistReviewResult> specialistReviews = await RunSpecialistReviewsAsync(
            model,
            request.DeclaredPriorities,
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

        if (request.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(model, interview, request.FramingAnswers);
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

        if (interview.IsFramingComplete)
        {
            recommendations = (await _recommendationEngine
                .BuildRecommendationsAsync(
                    model,
                    recommendationSourceFindings,
                    request.DeclaredPriorities,
                    cancellationToken))
                .ToList();

            if (recommendations.Count > 0)
            {
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

                await IntegrateClosedLoopReReviewFindingsAsync(
                    request,
                    reReview,
                    allFindings,
                    validationResults,
                    validationByFindingId,
                    cancellationToken).ConfigureAwait(false);
            }
        }

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(
                allFindings,
                recommendations,
                await TryLoadLedgerEntriesAsync(request, cancellationToken))
            .ToList();

        TrustPublishDecision publishDecision = _trustPublishGate.Decide(
            allFindings,
            recommendations,
            validationResults,
            mustNotFailViolations);

        if (!interview.IsFramingComplete)
        {
            publishDecision = ArchitectureFramingMustGate.MergeFramingIncompletePublishBlock(
                interview,
                publishDecision);
        }

        await SaveModelAsync(request.RunId, model, cancellationToken);

        string workspaceId = request.WorkspaceId ?? tenantId;
        string projectId = request.ProjectId ?? tenantId;

        ClosedLoopReasoningResult result = new()
        {
            Model = model,
            Interview = interview,
            SpecialistReviews = specialistReviews,
            Adversarial = adversarial,
            Recommendations = recommendations,
            ImpactResults = impactResults,
            ModelDiffs = modelDiffs,
            ReReview = reReview,
            MustNotFailViolations = mustNotFailViolations,
            ValidationResults = validationResults,
            PublishBlocked = publishDecision.PublishBlocked,
            ReviewCompleteBlocked = !interview.IsFramingComplete,
            PublishBlockReasons = publishDecision.BlockReasons,
            IntegrityPassedFindingIds = publishDecision.IntegrityPassedFindingIds.ToList(),
            RunId = request.RunId,
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
                request.RunId),
        };

        ArchitectureIntelligenceBudgetResultApplier.Apply(result, budget);

        if (request.PublishToProduct)
        {
            await ApplyProductPublishAsync(request, result, cancellationToken);
        }

        if (cacheManifest is not null)
        {
            _reviewResultCache.Set(cacheManifest, result);
        }

        return result;
    }

    private async Task IntegrateClosedLoopReReviewFindingsAsync(
        ClosedLoopReasoningRequest request,
        IncrementalReReviewResult reReview,
        List<SpecialistReviewFinding> allFindings,
        List<EvidenceValidationResult> validationResults,
        Dictionary<string, EvidenceValidationResult> validationByFindingId,
        CancellationToken cancellationToken)
    {
        List<SpecialistReviewFinding> incrementalFindings =
            ClosedLoopReReviewPublishIntegrator.SelectNewIncrementalFindings(reReview, allFindings);

        if (incrementalFindings.Count == 0)
            return;

        SpecialistFindingsSubstantiationResult substantiation = await _specialistFindingsSubstantiationService
            .SubstantiateAsync(incrementalFindings, cancellationToken)
            .ConfigureAwait(false);

        ClosedLoopReReviewPublishIntegrator.IntegrateFromSubstantiation(
            incrementalFindings,
            substantiation,
            allFindings,
            validationResults,
            validationByFindingId);

        if (_authorityFindingsSnapshotUpdater is null
            || _scopeContextProvider is null
            || !Guid.TryParse(request.RunId, out Guid runId))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<string> mergedFindingIds = await _authorityFindingsSnapshotUpdater
            .MergeSubstantiatedFindingsAsync(scope, runId, substantiation, cancellationToken)
            .ConfigureAwait(false);

        reReview.MergedFindingIds = mergedFindingIds;
    }

    private async Task ApplyProductPublishAsync(
        ClosedLoopReasoningRequest request,
        ClosedLoopReasoningResult result,
        CancellationToken cancellationToken)
    {
        string tenantId = RequireTenantId(request);
        string workspaceId = request.WorkspaceId ?? tenantId;
        string projectId = request.ProjectId ?? tenantId;

        ArchitectureIntelligencePublishResult publishResult = await _productPublishService.PublishAsync(
            result,
            tenantId,
            workspaceId,
            projectId,
            request.RunId!,
            cancellationToken);

        result.PublishedToProduct = publishResult.Published;
        result.PublishedFindingsSnapshotId = publishResult.FindingsSnapshotId;
        result.PublishedRecommendationCount = publishResult.RecommendationCount;
        result.PublishSkipReason = publishResult.SkipReason;
    }

    private async Task<List<string>> StoreSourcesAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken)
    {
        List<string> artifactIds = [];
        string tenantId = RequireTenantId(request);

        foreach (ClosedLoopReasoningSourceText sourceText in request.SourceTexts)
        {
            string artifactId = $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}{Guid.NewGuid():N}";
            ImmutableSourceArtifact artifact = new()
            {
                ArtifactId = artifactId,
                TenantId = tenantId,
                ContentType = sourceText.ContentType,
                FileName = sourceText.FileName,
                OwnershipClass = ArtifactOwnershipClass.Managed,
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                Version = "1",
            };

            byte[] content = Encoding.UTF8.GetBytes(sourceText.Content ?? string.Empty);
            await _sourceStore.StoreAsync(artifact, content, cancellationToken);
            artifactIds.Add(artifactId);
        }

        return artifactIds;
    }

    private async Task<ArchitectureKnowledgeModel> BuildModelAsync(
        ClosedLoopReasoningRequest request,
        List<string> artifactIds,
        CancellationToken cancellationToken)
    {
        string tenantId = RequireTenantId(request);
        ArchitectureKnowledgeModel model = _ontologyService.CreateEmptyModel(tenantId, request.RunId);

        if (request.SourceTexts.Count > 0)
        {
            IReadOnlyList<int> indexes = Enumerable.Range(0, request.SourceTexts.Count).ToList();
            ArchitectureModelElement[][] extractedBatches = await BoundedParallelMap.MapAsync(
                indexes,
                ExtractionMaxConcurrent,
                async (index, ct) =>
                {
                    ClosedLoopReasoningSourceText sourceText = request.SourceTexts[index];
                    string artifactId = artifactIds[index];
                    IReadOnlyList<ArchitectureModelElement> extracted = await _extractionService.ExtractAsync(
                        sourceText.Content,
                        artifactId,
                        ct);

                    return extracted.ToArray();
                },
                cancellationToken);

            foreach (ArchitectureModelElement[] extracted in extractedBatches)
            {
                foreach (ArchitectureModelElement element in extracted)
                {
                    model = _ontologyService.UpsertElement(model, element);
                }
            }
        }

        return model;
    }

    private async Task<List<SpecialistReviewResult>> RunSpecialistReviewsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken)
    {
        QualityDimension[] dimensions = DeclaredPrioritySpecialistDepthSelector
            .SelectDimensions(declaredPriorities)
            .ToArray();

        SpecialistReviewResult[] reviews = await BoundedParallelMap.MapAsync(
            dimensions,
            SpecialistReviewMaxConcurrent,
            async (dimension, ct) =>
            {
                SpecialistReviewResult dimensionResult = await _specialistReviewService.ReviewAsync(
                    model,
                    [dimension],
                    ct);
                dimensionResult.Dimension = dimension;

                return dimensionResult;
            },
            cancellationToken);

        return reviews.ToList();
    }

    private async Task<List<EvidenceValidationResult>> ValidateFindingsAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken)
    {
        if (findings.Count == 0)
            return [];

        EvidenceValidationResult[] validationResults = await BoundedParallelMap.MapAsync(
            findings,
            EvidenceValidationMaxConcurrent,
            async (finding, ct) =>
            {
                List<string> citedArtifactIds = finding.EvidenceArtifactIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                List<string> citedQuotes = [];

                if (finding.Provenance.PassageLocator is not null
                    && !string.IsNullOrWhiteSpace(finding.Provenance.PassageLocator.Quote))
                {
                    citedQuotes.Add(finding.Provenance.PassageLocator.Quote);
                }

                citedQuotes = EvidenceValidationSourceReread.AugmentCitedQuotesForHighSeverity(
                    finding,
                    citedQuotes,
                    _sourceStore);

                string claimedConclusion = $"{finding.Conclusion}:{finding.Severity}:{finding.Title}";

                return await _evidenceValidationPipeline.ValidateAsync(
                    finding.FindingId,
                    citedArtifactIds,
                    citedQuotes,
                    _sourceStore,
                    claimedConclusion,
                    ct);
            },
            cancellationToken);

        return validationResults.ToList();
    }

    private async Task<IReadOnlyList<TechnologyLedgerEntry>?> TryLoadLedgerEntriesAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken)
    {
        if (_technologyLedgerRepository is null
            || _scopeContextProvider is null
            || string.IsNullOrWhiteSpace(request.RunId))
        {
            return null;
        }

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _technologyLedgerRepository
                .GetByRunIdAsync(scope, request.RunId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static void MergeAdversarialChallengesIntoModel(
        ArchitectureKnowledgeModel model,
        AdversarialReviewResult adversarial)
    {
        foreach (AdversarialChallenge challenge in adversarial.Challenges)
        {
            if (challenge.Suppressed)
            {
                continue;
            }

            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = challenge.ChallengeId,
                Kind = ArchitectureElementKind.UnresolvedQuestion,
                Name = challenge.Hypothesis,
                Description = challenge.FalsificationEvidenceNeeded,
                ExtractionConfidence = challenge.Confidence,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.SystemProposed,
                    SupportStatus = SupportStatus.NotYetEvaluated,
                    Confidence = challenge.Confidence,
                    Notes = "Adversarial challenge lane; not a substantiated finding.",
                },
            });
        }
    }

    private static string RequireTenantId(ClosedLoopReasoningRequest request)
    {
        string tenantId = request.TenantId?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        return tenantId;
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadExistingModelAsync(
        string tenantId,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _knowledgeModelAccess
                .GetForRunAsync(scope, parsedRunId, cancellationToken)
                .ConfigureAwait(false);
        }

        if (_persistence is null)
            return null;

        return await _persistence
            .GetModelByRunIdAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task SaveModelAsync(
        string? runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && !string.IsNullOrWhiteSpace(runId)
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            await _knowledgeModelAccess.SaveForRunAsync(scope, parsedRunId, model, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        if (_persistence is not null)
            await _persistence.SaveModelAsync(model, cancellationToken).ConfigureAwait(false);
    }
}
