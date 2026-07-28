using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopArchitectureReasoningOrchestrator : IClosedLoopArchitectureReasoningOrchestrator
{
    private readonly IImmutableSourceStore _sourceStore;
    private readonly IArchitectureOntologyService _ontologyService;
    private readonly IAsyncArchitectureExtractionService _extractionService;
    private readonly IProgressiveInterviewService _interviewService;
    private readonly IAsyncSpecialistReviewService _specialistReviewService;
    private readonly ISpecialistReviewService _heuristicSpecialistReviewService;
    private readonly IEvidenceValidationPipeline _evidenceValidationPipeline;
    private readonly IAsyncAdversarialReviewService _adversarialReviewService;
    private readonly IAsyncArchitectureRecommendationEngine _recommendationEngine;
    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer;
    private readonly IArchitectureModelDiffApplier _modelDiffApplier;
    private readonly IIncrementalReReviewService _incrementalReReviewService;
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer;
    private readonly ITrustPublishGate _trustPublishGate;
    private readonly IArchitectureIntelligenceProductPublishService _productPublishService;
    private readonly IArchitectureIntelligencePersistence? _persistence;

    public ClosedLoopArchitectureReasoningOrchestrator(
        IImmutableSourceStore sourceStore,
        IArchitectureOntologyService ontologyService,
        IAsyncArchitectureExtractionService extractionService,
        IProgressiveInterviewService interviewService,
        IAsyncSpecialistReviewService specialistReviewService,
        ISpecialistReviewService heuristicSpecialistReviewService,
        IEvidenceValidationPipeline evidenceValidationPipeline,
        IAsyncAdversarialReviewService adversarialReviewService,
        IAsyncArchitectureRecommendationEngine recommendationEngine,
        IChangeImpactAnalyzer changeImpactAnalyzer,
        IArchitectureModelDiffApplier modelDiffApplier,
        IIncrementalReReviewService incrementalReReviewService,
        IMustNotFailEnforcer mustNotFailEnforcer,
        ITrustPublishGate trustPublishGate,
        IArchitectureIntelligenceProductPublishService productPublishService,
        IArchitectureIntelligencePersistence? persistence = null)
    {
        _sourceStore = sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));
        _ontologyService = ontologyService ?? throw new ArgumentNullException(nameof(ontologyService));
        _extractionService = extractionService ?? throw new ArgumentNullException(nameof(extractionService));
        _interviewService = interviewService ?? throw new ArgumentNullException(nameof(interviewService));
        _specialistReviewService = specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));
        _heuristicSpecialistReviewService = heuristicSpecialistReviewService
            ?? throw new ArgumentNullException(nameof(heuristicSpecialistReviewService));
        _evidenceValidationPipeline = evidenceValidationPipeline ?? throw new ArgumentNullException(nameof(evidenceValidationPipeline));
        _adversarialReviewService = adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));
        _recommendationEngine = recommendationEngine ?? throw new ArgumentNullException(nameof(recommendationEngine));
        _changeImpactAnalyzer = changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));
        _modelDiffApplier = modelDiffApplier ?? throw new ArgumentNullException(nameof(modelDiffApplier));
        _incrementalReReviewService = incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));
        _mustNotFailEnforcer = mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));
        _trustPublishGate = trustPublishGate ?? throw new ArgumentNullException(nameof(trustPublishGate));
        _productPublishService = productPublishService ?? throw new ArgumentNullException(nameof(productPublishService));
        _persistence = persistence;
    }

    public async Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            request.RunId = Guid.NewGuid().ToString("N");
        }

        ArchitectureKnowledgeModel model;
        List<string> storedArtifactIds = [];

        if (request.ContinueFromExistingRun
            && _persistence is not null
            && !string.IsNullOrWhiteSpace(request.RunId))
        {
            ArchitectureKnowledgeModel? existing = await _persistence.GetModelByRunIdAsync(
                request.TenantId,
                request.RunId,
                cancellationToken);

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

        List<SpecialistReviewResult> specialistReviews = await RunSpecialistReviewsAsync(model, cancellationToken);
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

        List<ArchitectureRecommendation> recommendations = (await _recommendationEngine
            .BuildRecommendationsAsync(model, recommendationSourceFindings, request.DeclaredPriorities, cancellationToken))
            .ToList();

        List<ChangeImpactResult> impactResults = [];
        List<ArchitectureModelDiff> modelDiffs = [];
        IncrementalReReviewResult? reReview = null;

        if (recommendations.Count > 0)
        {
            ArchitectureRecommendation firstRecommendation = recommendations[0];
            ArchitectureModelDiff diff = _modelDiffApplier.ApplyRecommendation(model, firstRecommendation);
            modelDiffs.Add(diff);

            ChangeImpactResult impact = _changeImpactAnalyzer.Analyze(diff, firstRecommendation);
            impactResults.Add(impact);

            ReReviewScope scope = new()
            {
                AffectedElementIds = impact.ImpactedItems.Select(item => item.ElementId).Distinct(StringComparer.Ordinal).ToList(),
                IncludeGlobalInvariantChecks = true,
                FullReReview = impact.RequiresFullReReview,
                Trigger = ResolveReReviewTrigger(impact, firstRecommendation),
            };

            reReview = _incrementalReReviewService.ReReview(diff.AfterModel, scope, _heuristicSpecialistReviewService);
        }

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(allFindings, recommendations)
            .ToList();

        TrustPublishDecision publishDecision = _trustPublishGate.Decide(
            allFindings,
            recommendations,
            validationResults,
            mustNotFailViolations);

        if (_persistence is not null)
        {
            await _persistence.SaveModelAsync(model, cancellationToken);
        }

        string workspaceId = request.WorkspaceId ?? request.TenantId;
        string projectId = request.ProjectId ?? request.TenantId;
        Dictionary<string, EvidenceValidationResult> validationByFindingId = validationResults
            .ToDictionary(result => result.FindingId, StringComparer.Ordinal);

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
                request.TenantId,
                workspaceId,
                projectId,
                request.RunId),
        };

        if (request.PublishToProduct)
        {
            ArchitectureIntelligencePublishResult publishResult = await _productPublishService.PublishAsync(
                result,
                request.TenantId,
                workspaceId,
                projectId,
                request.RunId!,
                cancellationToken);

            result.PublishedToProduct = publishResult.Published;
            result.PublishedFindingsSnapshotId = publishResult.FindingsSnapshotId;
            result.PublishedRecommendationCount = publishResult.RecommendationCount;
            result.PublishSkipReason = publishResult.SkipReason;
        }

        return result;
    }

    private async Task<List<string>> StoreSourcesAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken)
    {
        List<string> artifactIds = [];

        foreach (ClosedLoopReasoningSourceText sourceText in request.SourceTexts)
        {
            string artifactId = $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}{Guid.NewGuid():N}";
            ImmutableSourceArtifact artifact = new()
            {
                ArtifactId = artifactId,
                TenantId = request.TenantId,
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
        ArchitectureKnowledgeModel model = _ontologyService.CreateEmptyModel(request.TenantId, request.RunId);

        for (int index = 0; index < request.SourceTexts.Count; index++)
        {
            ClosedLoopReasoningSourceText sourceText = request.SourceTexts[index];
            string artifactId = artifactIds[index];
            IReadOnlyList<ArchitectureModelElement> extracted = await _extractionService.ExtractAsync(
                sourceText.Content,
                artifactId,
                cancellationToken);

            foreach (ArchitectureModelElement element in extracted)
            {
                model = _ontologyService.UpsertElement(model, element);
            }
        }

        return model;
    }

    private async Task<List<SpecialistReviewResult>> RunSpecialistReviewsAsync(
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken)
    {
        QualityDimension[] dimensions =
        [
            QualityDimension.Reliability,
            QualityDimension.Security,
            QualityDimension.Cost,
        ];

        List<SpecialistReviewResult> reviews = [];

        foreach (QualityDimension dimension in dimensions)
        {
            SpecialistReviewResult dimensionResult = await _specialistReviewService.ReviewAsync(
                model,
                [dimension],
                cancellationToken);
            dimensionResult.Dimension = dimension;
            reviews.Add(dimensionResult);
        }

        return reviews;
    }

    private async Task<List<EvidenceValidationResult>> ValidateFindingsAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken)
    {
        List<EvidenceValidationResult> validationResults = [];

        foreach (SpecialistReviewFinding finding in findings)
        {
            List<string> citedArtifactIds = finding.EvidenceArtifactIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .ToList();

            // Prefer an explicit passage quote when the provenance locator carries text; otherwise
            // verify artifact existence + hash only (empty quote list → null expectedQuote per artifact).
            List<string> citedQuotes = [];

            if (finding.Provenance.PassageLocator is not null
                && !string.IsNullOrWhiteSpace(finding.Provenance.PassageLocator.Quote))
            {
                citedQuotes.Add(finding.Provenance.PassageLocator.Quote);
            }

            string claimedConclusion = $"{finding.Conclusion}:{finding.Severity}:{finding.Title}";

            validationResults.Add(await _evidenceValidationPipeline.ValidateAsync(
                finding.FindingId,
                citedArtifactIds,
                citedQuotes,
                _sourceStore,
                claimedConclusion,
                cancellationToken));
        }

        return validationResults;
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

    private static ReReviewTrigger? ResolveReReviewTrigger(
        ChangeImpactResult impact,
        ArchitectureRecommendation recommendation)
    {
        if (!impact.RequiresFullReReview)
        {
            return null;
        }

        if (recommendation.ProposedChange.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
        {
            return ReReviewTrigger.NewTrustBoundary;
        }

        if (recommendation.ProposedChange.Contains("jurisdiction", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("residency", StringComparison.OrdinalIgnoreCase))
        {
            return ReReviewTrigger.NewJurisdiction;
        }

        if (recommendation.ProposedChange.Contains("data classification", StringComparison.OrdinalIgnoreCase))
        {
            return ReReviewTrigger.NewDataClassification;
        }

        return ReReviewTrigger.MajorTopologyChange;
    }
}
