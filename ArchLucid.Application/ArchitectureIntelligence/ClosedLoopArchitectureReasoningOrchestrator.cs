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
    private readonly IAdversarialReviewService _adversarialReviewService;
    private readonly IAsyncArchitectureRecommendationEngine _recommendationEngine;
    private readonly IChangeImpactAnalyzer _changeImpactAnalyzer;
    private readonly IIncrementalReReviewService _incrementalReReviewService;
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer;
    private readonly IArchitectureIntelligencePersistence? _persistence;

    public ClosedLoopArchitectureReasoningOrchestrator(
        IImmutableSourceStore sourceStore,
        IArchitectureOntologyService ontologyService,
        IAsyncArchitectureExtractionService extractionService,
        IProgressiveInterviewService interviewService,
        IAsyncSpecialistReviewService specialistReviewService,
        ISpecialistReviewService heuristicSpecialistReviewService,
        IEvidenceValidationPipeline evidenceValidationPipeline,
        IAdversarialReviewService adversarialReviewService,
        IAsyncArchitectureRecommendationEngine recommendationEngine,
        IChangeImpactAnalyzer changeImpactAnalyzer,
        IIncrementalReReviewService incrementalReReviewService,
        IMustNotFailEnforcer mustNotFailEnforcer,
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
        _incrementalReReviewService = incrementalReReviewService ?? throw new ArgumentNullException(nameof(incrementalReReviewService));
        _mustNotFailEnforcer = mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));
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

        List<string> storedArtifactIds = await StoreSourcesAsync(request, cancellationToken);
        ArchitectureKnowledgeModel model = await BuildModelAsync(request, storedArtifactIds, cancellationToken);
        model.DeclaredPriorities.AddRange(request.DeclaredPriorities);

        ProgressiveInterviewState interview = _interviewService.BuildFramingState(model, request.SourceTexts);
        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions([])
            .ToList();

        List<SpecialistReviewResult> specialistReviews = await RunSpecialistReviewsAsync(model, cancellationToken);
        List<SpecialistReviewFinding> allFindings = specialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions(specialistReviews)
            .ToList();

        List<EvidenceValidationResult> validationResults = ValidateFindings(allFindings, storedArtifactIds, request.SourceTexts);
        AdversarialReviewResult adversarial = _adversarialReviewService.Review(allFindings);
        List<ArchitectureRecommendation> recommendations = (await _recommendationEngine
            .BuildRecommendationsAsync(model, allFindings, request.DeclaredPriorities, cancellationToken))
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

            reReview = _incrementalReReviewService.ReReview(model, scope, _heuristicSpecialistReviewService);
        }

        List<MustNotFailViolation> mustNotFailViolations = _mustNotFailEnforcer
            .Evaluate(allFindings, recommendations)
            .ToList();

        if (_persistence is not null)
        {
            await _persistence.SaveModelAsync(model, cancellationToken);
        }

        string workspaceId = request.WorkspaceId ?? request.TenantId;
        string projectId = request.ProjectId ?? request.TenantId;

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
            ProductFindings = ArchitectureIntelligenceProductBridge.ToFindings(allFindings),
            ProductRecommendations = ArchitectureIntelligenceProductBridge.ToRecommendationRecords(
                recommendations,
                allFindings,
                request.TenantId,
                workspaceId,
                projectId,
                request.RunId),
        };

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
