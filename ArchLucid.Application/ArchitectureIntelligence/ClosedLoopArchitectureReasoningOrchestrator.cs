using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopArchitectureReasoningOrchestrator : IClosedLoopArchitectureReasoningOrchestrator
{
    private readonly IImmutableSourceStore _sourceStore;
    private readonly IArchitectureOntologyService _ontologyService;
    private readonly IDifficultyBasedExtractionRouter _extractionRouter;
    private readonly IProgressiveInterviewService _interviewService;
    private readonly ISpecialistReviewService _specialistReviewService;
    private readonly IEvidenceValidationPipeline _evidenceValidationPipeline;
    private readonly IAdversarialReviewService _adversarialReviewService;
    private readonly IArchitectureRecommendationEngine _recommendationEngine;
    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer;
    private readonly IIncrementalReReviewService _incrementalReReviewService;
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer;

    public ClosedLoopArchitectureReasoningOrchestrator(
        IImmutableSourceStore sourceStore,
        IArchitectureOntologyService ontologyService,
        IDifficultyBasedExtractionRouter extractionRouter,
        IProgressiveInterviewService interviewService,
        ISpecialistReviewService specialistReviewService,
        IEvidenceValidationPipeline evidenceValidationPipeline,
        IAdversarialReviewService adversarialReviewService,
        IArchitectureRecommendationEngine recommendationEngine,
        IChangeImpactAnalyzer changeImpactAnalyzer,
        IIncrementalReReviewService incrementalReReviewService,
        IMustNotFailEnforcer mustNotFailEnforcer)
    {
        _sourceStore = sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));
        _ontologyService = ontologyService ?? throw new ArgumentNullException(nameof(ontologyService));
        _extractionRouter = extractionRouter ?? throw new ArgumentNullException(nameof(extractionRouter));
        _interviewService = interviewService ?? throw new ArgumentNullException(nameof(interviewService));
        _specialistReviewService = specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));
        _evidenceValidationPipeline = evidenceValidationPipeline ?? throw new ArgumentNullException(nameof(evidenceValidationPipeline));
        _adversarialReviewService = adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));
        _recommendationEngine = recommendationEngine ?? throw new ArgumentNullException(nameof(recommendationEngine));
        _changeImpactAnalyzer = changeImpactAnalyzer ?? throw new ArgumentNullException(nameof(changeImpactAnalyzer));
        _incrementalReReviewService = incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));
        _mustNotFailEnforcer = mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));
    }

    public Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        cancellationToken.ThrowIfCancellationRequested();

        List<string> storedArtifactIds = StoreSources(request);
        ArchitectureKnowledgeModel model = BuildModel(request, storedArtifactIds);
        model.DeclaredPriorities.AddRange(request.DeclaredPriorities);

        ProgressiveInterviewState interview = _interviewService.BuildFramingState(model, request.SourceTexts);
        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions([])
            .ToList();

        List<SpecialistReviewResult> specialistReviews = RunSpecialistReviews(model);
        List<SpecialistReviewFinding> allFindings = specialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions(specialistReviews)
            .ToList();

        List<EvidenceValidationResult> validationResults = ValidateFindings(allFindings, storedArtifactIds, request.SourceTexts);
        AdversarialReviewResult adversarial = _adversarialReviewService.Review(allFindings);
        List<ArchitectureRecommendation> recommendations = _recommendationEngine
            .BuildRecommendations(model, allFindings, request.DeclaredPriorities)
            .ToList();

        List<ChangeImpactResult> impactResults = [];
        IncrementalReReviewResult? reReview = null;

        if (recommendations.Count > 0)
        {
            ArchitectureRecommendation firstRecommendation = recommendations[0];
            ChangeImpactResult impact = _changeImpactAnalyzer.Analyze(model, firstRecommendation);
            impactResults.Add(impact);

            ReReviewScope scope = new()
            {
                AffectedElementIds = impact.ImpactedItems.Select(item => item.ElementId).ToList(),
                IncludeGlobalInvariantChecks = true,
                FullReReview = impact.RequiresFullReReview,
                Trigger = impact.RequiresFullReReview ? ReReviewTrigger.MajorTopologyChange : null,
            };

            reReview = _incrementalReReviewService.ReReview(model, scope, _specialistReviewService);
        }

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(allFindings, recommendations)
            .ToList();

        ClosedLoopReasoningResult result = new()
        {
            Model = model,
            Interview = interview,
            SpecialistReviews = specialistReviews,
            Adversarial = adversarial,
            Recommendations = recommendations,
            ImpactResults = impactResults,
            ReReview = reReview,
            MustNotFailViolations = mustNotFailViolations,
            ValidationResults = validationResults,
        };

        return Task.FromResult(result);
    }

    private List<string> StoreSources(ClosedLoopReasoningRequest request)
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
            _sourceStore.Store(artifact, content);
            artifactIds.Add(artifactId);
        }

        return artifactIds;
    }

    private ArchitectureKnowledgeModel BuildModel(ClosedLoopReasoningRequest request, List<string> artifactIds)
    {
        ArchitectureKnowledgeModel model = _ontologyService.CreateEmptyModel(request.TenantId, request.RunId);

        for (int index = 0; index < request.SourceTexts.Count; index++)
        {
            ClosedLoopReasoningSourceText sourceText = request.SourceTexts[index];
            string artifactId = artifactIds[index];
            IReadOnlyList<ArchitectureModelElement> extracted = _extractionRouter.Extract(sourceText.Content, artifactId);

            foreach (ArchitectureModelElement element in extracted)
            {
                model = _ontologyService.UpsertElement(model, element);
            }
        }

        return model;
    }

    private List<SpecialistReviewResult> RunSpecialistReviews(ArchitectureKnowledgeModel model)
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
            SpecialistReviewResult dimensionResult = _specialistReviewService.Review(model, [dimension]);
            dimensionResult.Dimension = dimension;
            reviews.Add(dimensionResult);
        }

        return reviews;
    }

    private List<EvidenceValidationResult> ValidateFindings(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> artifactIds,
        IReadOnlyList<ClosedLoopReasoningSourceText> sourceTexts)
    {
        List<EvidenceValidationResult> validationResults = [];
        string fallbackQuote = sourceTexts.FirstOrDefault()?.Content ?? string.Empty;

        foreach (SpecialistReviewFinding finding in findings)
        {
            List<string> citedArtifactIds = finding.EvidenceArtifactIds.Count > 0
                ? finding.EvidenceArtifactIds.ToList()
                : artifactIds.Take(1).ToList();

            List<string> citedQuotes = [fallbackQuote];
            string claimedConclusion = $"{finding.Conclusion}:{finding.Severity}";

            validationResults.Add(_evidenceValidationPipeline.Validate(
                finding.FindingId,
                citedArtifactIds,
                citedQuotes,
                _sourceStore,
                claimedConclusion));
        }

        return validationResults;
    }
}
