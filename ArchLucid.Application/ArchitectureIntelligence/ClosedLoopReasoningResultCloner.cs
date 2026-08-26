using System.Text.Json;
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
            CacheHit = source.CacheHit,
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
            Challenges = adversarial.Challenges.Select(CloneAdversarialChallenge).ToList(),
            FalsePositiveRateByLane = new Dictionary<AdversarialLane, double>(adversarial.FalsePositiveRateByLane),
        };
    }

    private static AdversarialChallenge CloneAdversarialChallenge(AdversarialChallenge challenge)
    {
        return new AdversarialChallenge
        {
            ChallengeId = challenge.ChallengeId,
            Hypothesis = challenge.Hypothesis,
            FalsificationEvidenceNeeded = challenge.FalsificationEvidenceNeeded,
            Confidence = challenge.Confidence,
            Lane = challenge.Lane,
            Suppressed = challenge.Suppressed,
            SuppressionReason = challenge.SuppressionReason,
            SourceFindingId = challenge.SourceFindingId,
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
            AlternativeOptions = recommendation.AlternativeOptions.Select(CloneAlternativeOption).ToList(),
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

    private static RecommendationAlternative CloneAlternativeOption(RecommendationAlternative option)
    {
        return new RecommendationAlternative
        {
            Path = option.Path,
            ValidationCriteria = option.ValidationCriteria,
        };
    }

    private static ChangeImpactResult CloneImpact(ChangeImpactResult impact)
    {
        return new ChangeImpactResult
        {
            RecommendationId = impact.RecommendationId,
            ImpactedItems = impact.ImpactedItems?.Select(CloneImpactItem).ToList() ?? [],
            GraphCompletenessCaveat = impact.GraphCompletenessCaveat,
            RequiresFullReReview = impact.RequiresFullReReview,
        };
    }

    private static ChangeImpactItem CloneImpactItem(ChangeImpactItem item)
    {
        return new ChangeImpactItem
        {
            ElementId = item.ElementId,
            ImpactKind = item.ImpactKind,
            Description = item.Description,
            Category = item.Category,
        };
    }

    private static IncrementalReReviewResult CloneReReview(IncrementalReReviewResult reReview)
    {
        return new IncrementalReReviewResult
        {
            Scope = CloneReReviewScope(reReview.Scope),
            SpecialistResults = reReview.SpecialistResults.Select(CloneSpecialistReview).ToList(),
            GlobalInvariantResults = reReview.GlobalInvariantResults.Select(CloneGlobalInvariantResult).ToList(),
            FullReReviewTriggered = reReview.FullReReviewTriggered,
            PartialScopeDisclaimer = reReview.PartialScopeDisclaimer,
            MergedFindingIds = reReview.MergedFindingIds.ToList(),
        };
    }

    private static ReReviewScope CloneReReviewScope(ReReviewScope scope)
    {
        return new ReReviewScope
        {
            AffectedElementIds = scope.AffectedElementIds.ToList(),
            IncludeGlobalInvariantChecks = scope.IncludeGlobalInvariantChecks,
            FullReReview = scope.FullReReview,
            Trigger = scope.Trigger,
        };
    }

    private static GlobalInvariantCheckResult CloneGlobalInvariantResult(GlobalInvariantCheckResult result)
    {
        return new GlobalInvariantCheckResult
        {
            InvariantId = result.InvariantId,
            Passed = result.Passed,
            Detail = result.Detail,
        };
    }

    private static ArchitectureModelDiff CloneModelDiff(ArchitectureModelDiff diff)
    {
        return new ArchitectureModelDiff
        {
            RecommendationId = diff.RecommendationId,
            Entries = diff.Entries?.Select(CloneModelDiffEntry).ToList() ?? [],
            BeforeModel = diff.BeforeModel is null || diff.BeforeModel.Elements.Count == 0
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.BeforeModel),
            AfterModel = diff.AfterModel is null || diff.AfterModel.Elements.Count == 0
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.AfterModel),
        };
    }

    private static ArchitectureModelDiffEntry CloneModelDiffEntry(ArchitectureModelDiffEntry entry)
    {
        return new ArchitectureModelDiffEntry
        {
            ElementId = entry.ElementId,
            ChangeKind = entry.ChangeKind,
            ElementKind = entry.ElementKind,
            Description = entry.Description,
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
            StageResults = result.StageResults.Select(CloneValidationStageOutcome).ToList(),
            OverallPassedIntegrity = result.OverallPassedIntegrity,
            SemanticAssessment = result.SemanticAssessment,
            CompletenessNotes = result.CompletenessNotes,
            Escalated = result.Escalated,
            SupportTier = result.SupportTier,
        };
    }

    private static EvidenceValidationStageOutcome CloneValidationStageOutcome(EvidenceValidationStageOutcome outcome)
    {
        return new EvidenceValidationStageOutcome
        {
            Stage = outcome.Stage,
            Passed = outcome.Passed,
            Detail = outcome.Detail,
            IsDeterministic = outcome.IsDeterministic,
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
            Payload = ClonePayload(finding.Payload),
            PayloadType = finding.PayloadType,
            Trace = CloneExplainabilityTrace(finding.Trace),
            RequestInputRef = finding.RequestInputRef,
            RunIdRef = finding.RunIdRef,
            AgentExecutionTraceId = finding.AgentExecutionTraceId,
            ModelDeploymentName = finding.ModelDeploymentName,
            ModelAlias = finding.ModelAlias,
            ModelVersion = finding.ModelVersion,
            PromptTemplateId = finding.PromptTemplateId,
            PromptTemplateVersion = finding.PromptTemplateVersion,
            ConfidenceScore = finding.ConfidenceScore,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
            PolicyRuleId = finding.PolicyRuleId,
            HumanReviewStatus = finding.HumanReviewStatus,
            ReviewedByUserId = finding.ReviewedByUserId,
            ReviewedAtUtc = finding.ReviewedAtUtc,
            ReviewNotes = finding.ReviewNotes,
            ProjectedImpactUsd = finding.ProjectedImpactUsd,
            IsMuted = finding.IsMuted,
            MuteReason = finding.MuteReason,
            EnforcementTier = finding.EnforcementTier,
            InsightDensityScore = finding.InsightDensityScore,
            Treatment = finding.Treatment,
            Classification = finding.Classification,
            WhyThisIsNotGeneric = finding.WhyThisIsNotGeneric,
            PrincipalArchitectValue = finding.PrincipalArchitectValue,
            DecisionConsequence = finding.DecisionConsequence,
            AssignedToUserId = finding.AssignedToUserId,
            RemediationDueUtc = finding.RemediationDueUtc,
        };
    }

    private static object? ClonePayload(object? payload)
    {
        if (payload is null)
            return null;

        if (payload is JsonElement jsonElement)
            return jsonElement.Clone();

        if (payload is Dictionary<string, string> stringDictionary)
            return new Dictionary<string, string>(stringDictionary, StringComparer.Ordinal);

        if (payload is ICloneable cloneable)
            return cloneable.Clone();

        object? deserialized = JsonSerializer.Deserialize(
            JsonSerializer.Serialize(payload),
            payload.GetType());

        if (deserialized is null)
            throw new InvalidOperationException(
                $"Unable to deep-clone finding payload of type '{payload.GetType().FullName}'.");

        return deserialized;
    }

    private static ExplainabilityTrace CloneExplainabilityTrace(ExplainabilityTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new ExplainabilityTrace
        {
            SourceAgentExecutionTraceId = trace.SourceAgentExecutionTraceId,
            GraphNodeIdsExamined = trace.GraphNodeIdsExamined.ToList(),
            RulesApplied = trace.RulesApplied.ToList(),
            DecisionsTaken = trace.DecisionsTaken.ToList(),
            AlternativePathsConsidered = trace.AlternativePathsConsidered.ToList(),
            Notes = trace.Notes.ToList(),
            Citations = trace.Citations.ToList(),
            ReasoningTrace = trace.ReasoningTrace,
            ReasoningTraceDigestSha256 = trace.ReasoningTraceDigestSha256,
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
            CategoryScores = metrics.CategoryScores.Select(CloneCategoryBenchmarkScore).ToList(),
            MutationChangedFindings = metrics.MutationChangedFindings,
            ReReviewTriggered = metrics.ReReviewTriggered,
            Passed = metrics.Passed,
            Notes = metrics.Notes,
        };
    }

    private static CategoryBenchmarkScore CloneCategoryBenchmarkScore(CategoryBenchmarkScore score)
    {
        return new CategoryBenchmarkScore
        {
            Category = score.Category,
            Score = score.Score,
            Detail = score.Detail,
        };
    }
}
