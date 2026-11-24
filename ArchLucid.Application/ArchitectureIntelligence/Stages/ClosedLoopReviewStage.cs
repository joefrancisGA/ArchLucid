using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Concurrency;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class ClosedLoopReviewStage(
    IProgressiveInterviewService interviewService,
    IAsyncSpecialistReviewService specialistReviewService,
    IEvidenceValidationPipeline evidenceValidationPipeline,
    IAsyncAdversarialReviewService adversarialReviewService,
    IImmutableSourceStore sourceStore,
    ScopedPublicNetworkAccessVerifier? publicNetworkAccessVerifier = null) : IClosedLoopReviewStage
{
    private const int SpecialistReviewMaxConcurrent = 3;
    private const int EvidenceValidationMaxConcurrent = 4;

    private readonly IProgressiveInterviewService _interviewService =
        interviewService ?? throw new ArgumentNullException(nameof(interviewService));

    private readonly IAsyncSpecialistReviewService _specialistReviewService =
        specialistReviewService ?? throw new ArgumentNullException(nameof(specialistReviewService));

    private readonly IEvidenceValidationPipeline _evidenceValidationPipeline =
        evidenceValidationPipeline ?? throw new ArgumentNullException(nameof(evidenceValidationPipeline));

    private readonly IAsyncAdversarialReviewService _adversarialReviewService =
        adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));

    private readonly IImmutableSourceStore _sourceStore =
        sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));

    public async Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        ClosedLoopReasoningRequest effectiveRequest = context.EffectiveRequest;
        ProgressiveInterviewState interview = context.Interview;

        context.SpecialistReviews = await RunSpecialistReviewsAsync(
            context.Model,
            effectiveRequest.DeclaredPriorities,
            cancellationToken);

        if (!interview.IsFramingComplete)
        {
            context.Model.IsProvisionalSynthesis = true;
            SpecialistReviewProvisionalGating.ApplyWhileFramingIncomplete(context.SpecialistReviews);
        }
        else
        {
            context.Model.IsProvisionalSynthesis = false;
        }

        context.AllFindings = context.SpecialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        interview.EvidenceDrivenQuestions = _interviewService
            .DeriveEvidenceDrivenQuestions(context.SpecialistReviews)
            .ToList();

        if (effectiveRequest.FramingAnswers.Count > 0)
        {
            interview = _interviewService.ApplyAnswers(context.Model, interview, effectiveRequest.FramingAnswers);
        }

        context.Interview = interview;

        context.ValidationResults = await ValidateFindingsAsync(context, cancellationToken);

        context.ValidationByFindingId = context.ValidationResults
            .ToDictionary(result => result.FindingId, StringComparer.Ordinal);

        foreach (SpecialistReviewFinding finding in context.AllFindings)
        {
            if (!context.ValidationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation))
                continue;

            EvidenceSupportTierResolver.ApplyToFinding(finding, validation);
        }

        HashSet<string> supportedIds = EvidenceSupportTierResolver.SupportedFindingIds(context.ValidationResults);

        context.Adversarial = await _adversarialReviewService.ReviewAsync(
            context.AllFindings,
            supportedIds,
            cancellationToken);

        int challengeQuestionIndex = interview.EvidenceDrivenQuestions.Count;

        foreach (string openQuestion in _adversarialReviewService.ToOpenQuestions(context.Adversarial))
        {
            bool alreadyPresent = interview.EvidenceDrivenQuestions
                .Any(question => string.Equals(question.Prompt, openQuestion, StringComparison.Ordinal));

            if (alreadyPresent)
                continue;

            challengeQuestionIndex++;
            interview.EvidenceDrivenQuestions.Add(new FramingQuestion
            {
                QuestionId = $"adversarial-{challengeQuestionIndex}",
                Prompt = openQuestion,
                IsAnswered = false,
                Source = FramingQuestionSource.EvidenceDriven,
            });
        }

        MergeAdversarialChallengesIntoModel(context.Model, context.Adversarial);
        context.Interview = interview;
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
        ClosedLoopStageContext context,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<SpecialistReviewFinding> findings = context.AllFindings;
        if (findings.Count == 0)
            return [];

        EvidenceValidationResult[] validationResults = await BoundedParallelMap.MapAsync(
            findings,
            EvidenceValidationMaxConcurrent,
            async (finding, ct) =>
            {
                if (finding.PublicNetworkAccessDisabledResourceId is Guid resourceId)
                {
                    PublicNetworkAccessVerification observation = publicNetworkAccessVerifier is null
                        ? new(resourceId, PublicNetworkAccessVerificationOutcome.Unverified)
                        : await publicNetworkAccessVerifier.VerifyAsync(context.TenantId, context.EffectiveRequest.WorkspaceId,
                            context.EffectiveRequest.ProjectId, context.RunId, resourceId, ct);
                    return new EvidenceValidationResult
                    {
                        FindingId = finding.FindingId,
                        PublicNetworkAccess = observation,
                        Escalated = observation.Outcome != PublicNetworkAccessVerificationOutcome.Verified,
                        SemanticMethod = SemanticAssessmentMethod.NotPerformed,
                    };
                }

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

    private static void MergeAdversarialChallengesIntoModel(
        ArchitectureKnowledgeModel model,
        AdversarialReviewResult adversarial)
    {
        foreach (AdversarialChallenge challenge in adversarial.Challenges)
        {
            if (challenge.Suppressed)
                continue;

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
}
