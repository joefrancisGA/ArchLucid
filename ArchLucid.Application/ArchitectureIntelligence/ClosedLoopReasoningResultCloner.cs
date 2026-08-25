using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Isolates cached closed-loop results from caller mutations and concurrent cache hits.
/// </summary>
internal static class ClosedLoopReasoningResultCloner
{
    public static ClosedLoopReasoningResult Clone(ClosedLoopReasoningResult source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ClosedLoopReasoningResult
        {
            Model = ArchitectureKnowledgeModelCloner.Clone(source.Model),
            Interview = CloneInterview(source.Interview),
            SpecialistReviews = source.SpecialistReviews.Select(CloneSpecialistReview).ToList(),
            Adversarial = CloneAdversarial(source.Adversarial),
            Recommendations = source.Recommendations.Select(CloneRecommendation).ToList(),
            ImpactResults = source.ImpactResults.Select(CloneImpact).ToList(),
            ReReview = source.ReReview is null ? null : CloneReReview(source.ReReview),
            GoldenMetrics = source.GoldenMetrics is null ? null : CloneGoldenMetrics(source.GoldenMetrics),
            MustNotFailViolations = source.MustNotFailViolations.Select(CloneMustNotFailViolation).ToList(),
            ValidationResults = source.ValidationResults.Select(CloneValidationResult).ToList(),
            ProductFindings = source.ProductFindings.Select(CloneProductFinding).ToList(),
            ProductRecommendations = source.ProductRecommendations.Select(CloneProductRecommendation).ToList(),
            PublishBlocked = source.PublishBlocked,
            ReviewCompleteBlocked = source.ReviewCompleteBlocked,
            PublishBlockReasons = source.PublishBlockReasons.ToList(),
            IntegrityPassedFindingIds = source.IntegrityPassedFindingIds.ToList(),
            ModelDiffs = source.ModelDiffs.Select(CloneModelDiff).ToList(),
            RunId = source.RunId,
            ModelId = source.ModelId,
            PublishedToProduct = source.PublishedToProduct,
            PublishedFindingsSnapshotId = source.PublishedFindingsSnapshotId,
            PublishedRecommendationCount = source.PublishedRecommendationCount,
            PublishSkipReason = source.PublishSkipReason,
            CacheHit = false,
            CacheReuseReason = source.CacheReuseReason,
            BudgetRejected = source.BudgetRejected,
            BudgetRejectReason = source.BudgetRejectReason,
            BudgetEstimatedTokens = source.BudgetEstimatedTokens,
            BudgetMaxTokens = source.BudgetMaxTokens,
            BudgetEstimatedCostUsd = source.BudgetEstimatedCostUsd,
            BudgetRemainingUsd = source.BudgetRemainingUsd,
            BudgetEnforced = source.BudgetEnforced,
        };
    }

    private static ProgressiveInterviewState CloneInterview(ProgressiveInterviewState interview)
    {
        return new ProgressiveInterviewState
        {
            ModelId = interview.ModelId,
            FramingQuestions = interview.FramingQuestions.Select(CloneFramingQuestion).ToList(),
            EvidenceDrivenQuestions = interview.EvidenceDrivenQuestions.Select(CloneFramingQuestion).ToList(),
            IsFramingComplete = interview.IsFramingComplete,
        };
    }

    private static FramingQuestion CloneFramingQuestion(FramingQuestion question)
    {
        return new FramingQuestion
        {
            QuestionId = question.QuestionId,
            Prompt = question.Prompt,
            IsAnswered = question.IsAnswered,
            ConfirmedAnswer = question.ConfirmedAnswer,
            InferredAnswer = question.InferredAnswer,
            Source = question.Source,
        };
    }

    private static SpecialistReviewResult CloneSpecialistReview(SpecialistReviewResult review)
    {
        return new SpecialistReviewResult
        {
            Dimension = review.Dimension,
            Findings = review.Findings.Select(CloneFinding).ToList(),
            OpenQuestions = review.OpenQuestions.ToList(),
        };
    }

    private static SpecialistReviewFinding CloneFinding(SpecialistReviewFinding finding)
    {
        return new SpecialistReviewFinding
        {
            FindingId = finding.FindingId,
            Dimension = finding.Dimension,
            Title = finding.Title,
            Rationale = finding.Rationale,
            Conclusion = finding.Conclusion,
            EvidenceCondition = finding.EvidenceCondition,
            GovernanceDisposition = finding.GovernanceDisposition,
            Provenance = ArchitectureKnowledgeModelCloner.CloneProvenance(finding.Provenance),
            Confidence = finding.Confidence,
            EvidenceArtifactIds = finding.EvidenceArtifactIds.ToList(),
            Severity = finding.Severity,
            LifecycleScope = finding.LifecycleScope,
            RelatedModelElementIds = finding.RelatedModelElementIds.ToList(),
            RelatedRequirementElementIds = finding.RelatedRequirementElementIds.ToList(),
            RelatedDecisionElementIds = finding.RelatedDecisionElementIds.ToList(),
            EvidenceSupportTier = finding.EvidenceSupportTier,
        };
    }

    private static AdversarialReviewResult CloneAdversarial(AdversarialReviewResult adversarial)
    {
        return new AdversarialReviewResult
        {
            SubstantiatedFindings = adversarial.SubstantiatedFindings.Select(CloneFinding).ToList(),
            Challenges = adversarial.Challenges.ToList(),
            FalsePositiveRateByLane = new Dictionary<AdversarialLane, double>(adversarial.FalsePositiveRateByLane),
        };
    }

    private static ArchitectureRecommendation CloneRecommendation(ArchitectureRecommendation recommendation)
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = recommendation.RecommendationId,
            Problem = recommendation.Problem,
            Evidence = recommendation.Evidence,
            AffectedRequirementOrQualityAttribute = recommendation.AffectedRequirementOrQualityAttribute,
            ConsequenceOfInaction = recommendation.ConsequenceOfInaction,
            ProposedChange = recommendation.ProposedChange,
            Alternatives = recommendation.Alternatives.ToList(),
            AlternativeOptions = recommendation.AlternativeOptions.ToList(),
            TradeOffs = recommendation.TradeOffs.ToList(),
            Effort = recommendation.Effort,
            RiskReduction = recommendation.RiskReduction,
            Dependencies = recommendation.Dependencies.ToList(),
            ValidationMethod = recommendation.ValidationMethod,
            Confidence = recommendation.Confidence,
            RequiresHumanApproval = recommendation.RequiresHumanApproval,
            Provenance = ArchitectureKnowledgeModelCloner.CloneProvenance(recommendation.Provenance),
        };
    }

    private static ChangeImpactResult CloneImpact(ChangeImpactResult impact)
    {
        return new ChangeImpactResult
        {
            RecommendationId = impact.RecommendationId,
            ImpactedItems = impact.ImpactedItems?.ToList() ?? [],
            GraphCompletenessCaveat = impact.GraphCompletenessCaveat,
            RequiresFullReReview = impact.RequiresFullReReview,
        };
    }

    private static IncrementalReReviewResult CloneReReview(IncrementalReReviewResult reReview)
    {
        return new IncrementalReReviewResult
        {
            Scope = reReview.Scope,
            SpecialistResults = reReview.SpecialistResults.Select(CloneSpecialistReview).ToList(),
            GlobalInvariantResults = reReview.GlobalInvariantResults.ToList(),
            FullReReviewTriggered = reReview.FullReReviewTriggered,
            PartialScopeDisclaimer = reReview.PartialScopeDisclaimer,
        };
    }

    private static ArchitectureModelDiff CloneModelDiff(ArchitectureModelDiff diff)
    {
        return new ArchitectureModelDiff
        {
            RecommendationId = diff.RecommendationId,
            Entries = diff.Entries?.ToList() ?? [],
            BeforeModel = diff.BeforeModel is null || diff.BeforeModel.Elements.Count == 0
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.BeforeModel),
            AfterModel = new ArchitectureKnowledgeModel(),
        };
    }

    private static MustNotFailViolation CloneMustNotFailViolation(MustNotFailViolation violation)
    {
        return new MustNotFailViolation
        {
            Class = violation.Class,
            Message = violation.Message,
            Blocked = violation.Blocked,
            FindingId = violation.FindingId,
            RecommendationId = violation.RecommendationId,
        };
    }

    private static EvidenceValidationResult CloneValidationResult(EvidenceValidationResult result)
    {
        return new EvidenceValidationResult
        {
            FindingId = result.FindingId,
            StageResults = result.StageResults.ToList(),
            OverallPassedIntegrity = result.OverallPassedIntegrity,
            SemanticAssessment = result.SemanticAssessment,
            CompletenessNotes = result.CompletenessNotes,
            Escalated = result.Escalated,
            SupportTier = result.SupportTier,
        };
    }

    private static Finding CloneProductFinding(Finding finding)
    {
        return new Finding
        {
            FindingSchemaVersion = finding.FindingSchemaVersion,
            FindingId = finding.FindingId,
            FindingType = finding.FindingType,
            Category = finding.Category,
            QualityDimension = finding.QualityDimension,
            EngineType = finding.EngineType,
            Severity = finding.Severity,
            Title = finding.Title,
            Rationale = finding.Rationale,
            RelatedNodeIds = finding.RelatedNodeIds.ToList(),
            RecommendedActions = finding.RecommendedActions.ToList(),
            Properties = new Dictionary<string, string>(finding.Properties),
        };
    }

    private static RecommendationRecord CloneProductRecommendation(RecommendationRecord recommendation)
    {
        return new RecommendationRecord
        {
            RecommendationId = recommendation.RecommendationId,
            TenantId = recommendation.TenantId,
            WorkspaceId = recommendation.WorkspaceId,
            ProjectId = recommendation.ProjectId,
            RunId = recommendation.RunId,
            ComparedToRunId = recommendation.ComparedToRunId,
            Title = recommendation.Title,
            Category = recommendation.Category,
            Rationale = recommendation.Rationale,
            SuggestedAction = recommendation.SuggestedAction,
            Urgency = recommendation.Urgency,
            ExpectedImpact = recommendation.ExpectedImpact,
            PriorityScore = recommendation.PriorityScore,
            Status = recommendation.Status,
            CreatedUtc = recommendation.CreatedUtc,
            LastUpdatedUtc = recommendation.LastUpdatedUtc,
            ReviewedByUserId = recommendation.ReviewedByUserId,
            ReviewedByUserName = recommendation.ReviewedByUserName,
            ReviewComment = recommendation.ReviewComment,
            ResolutionRationale = recommendation.ResolutionRationale,
            SupportingFindingIdsJson = recommendation.SupportingFindingIdsJson,
            SupportingDecisionIdsJson = recommendation.SupportingDecisionIdsJson,
            SupportingArtifactIdsJson = recommendation.SupportingArtifactIdsJson,
            SourceEvidenceLinksJson = recommendation.SourceEvidenceLinksJson,
        };
    }

    private static GoldenArchitectureTestResult CloneGoldenMetrics(GoldenArchitectureTestResult metrics)
    {
        return new GoldenArchitectureTestResult
        {
            BeforeCounts = new Dictionary<string, int>(metrics.BeforeCounts),
            AfterCounts = new Dictionary<string, int>(metrics.AfterCounts),
            DeltaCounts = new Dictionary<string, int>(metrics.DeltaCounts),
            PlantedDefectRecall = metrics.PlantedDefectRecall,
            PlantedDefectsDetected = metrics.PlantedDefectsDetected.ToList(),
            PlantedDefectsMissed = metrics.PlantedDefectsMissed.ToList(),
            FalsePositiveCount = metrics.FalsePositiveCount,
            FalsePositivesByDimension = new Dictionary<string, int>(metrics.FalsePositivesByDimension),
            CategoryScores = metrics.CategoryScores.ToList(),
            MutationChangedFindings = metrics.MutationChangedFindings,
            ReReviewTriggered = metrics.ReReviewTriggered,
            Passed = metrics.Passed,
            Notes = metrics.Notes,
        };
    }
}
