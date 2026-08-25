using System.Text.Json.Serialization;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ArchitectureIntelligenceLlmResponseShapes
{
    internal sealed class ExtractionResponseShape
    {
        [JsonPropertyName("elements")]
        public List<ExtractionElementShape>? Elements
        {
            get;
            init;
        }
    }

    internal sealed class ExtractionElementShape
    {
        [JsonPropertyName("kind")]
        public string? Kind
        {
            get;
            init;
        }

        [JsonPropertyName("name")]
        public string? Name
        {
            get;
            init;
        }

        [JsonPropertyName("description")]
        public string? Description
        {
            get;
            init;
        }

        [JsonPropertyName("supportStatus")]
        public string? SupportStatus
        {
            get;
            init;
        }

        [JsonPropertyName("origin")]
        public string? Origin
        {
            get;
            init;
        }

        [JsonPropertyName("confidence")]
        public double? Confidence
        {
            get;
            init;
        }

        [JsonPropertyName("notes")]
        public string? Notes
        {
            get;
            init;
        }
    }

    internal sealed class ReviewResponseShape
    {
        [JsonPropertyName("findings")]
        public List<ReviewFindingShape>? Findings
        {
            get;
            init;
        }

        [JsonPropertyName("openQuestions")]
        public List<string>? OpenQuestions
        {
            get;
            init;
        }
    }

    internal sealed class ReviewFindingShape
    {
        [JsonPropertyName("title")]
        public string? Title
        {
            get;
            init;
        }

        [JsonPropertyName("rationale")]
        public string? Rationale
        {
            get;
            init;
        }

        [JsonPropertyName("conclusion")]
        public string? Conclusion
        {
            get;
            init;
        }

        [JsonPropertyName("evidenceCondition")]
        public string? EvidenceCondition
        {
            get;
            init;
        }

        [JsonPropertyName("severity")]
        public string? Severity
        {
            get;
            init;
        }

        [JsonPropertyName("confidence")]
        public double? Confidence
        {
            get;
            init;
        }

        [JsonPropertyName("supportStatus")]
        public string? SupportStatus
        {
            get;
            init;
        }

        [JsonPropertyName("notes")]
        public string? Notes
        {
            get;
            init;
        }
    }

    internal sealed class AdversarialResponseShape
    {
        [JsonPropertyName("challenges")]
        public List<AdversarialChallengeShape>? Challenges
        {
            get;
            init;
        }
    }

    internal sealed class AdversarialChallengeShape
    {
        [JsonPropertyName("hypothesis")]
        public string? Hypothesis
        {
            get;
            init;
        }

        [JsonPropertyName("falsificationEvidenceNeeded")]
        public string? FalsificationEvidenceNeeded
        {
            get;
            init;
        }

        [JsonPropertyName("confidence")]
        public double? Confidence
        {
            get;
            init;
        }

        [JsonPropertyName("suppressed")]
        public bool? Suppressed
        {
            get;
            init;
        }

        [JsonPropertyName("suppressionReason")]
        public string? SuppressionReason
        {
            get;
            init;
        }
    }

    internal sealed class RecommendationResponseShape
    {
        [JsonPropertyName("recommendations")]
        public List<RecommendationShape>? Recommendations
        {
            get;
            init;
        }
    }

    internal sealed class RecommendationShape
    {
        [JsonPropertyName("problem")]
        public string? Problem
        {
            get;
            init;
        }

        [JsonPropertyName("evidence")]
        public string? Evidence
        {
            get;
            init;
        }

        [JsonPropertyName("affectedRequirementOrQualityAttribute")]
        public string? AffectedRequirementOrQualityAttribute
        {
            get;
            init;
        }

        [JsonPropertyName("consequenceOfInaction")]
        public string? ConsequenceOfInaction
        {
            get;
            init;
        }

        [JsonPropertyName("proposedChange")]
        public string? ProposedChange
        {
            get;
            init;
        }

        [JsonPropertyName("alternatives")]
        public List<string>? Alternatives
        {
            get;
            init;
        }

        [JsonPropertyName("validationMethod")]
        public string? ValidationMethod
        {
            get;
            init;
        }

        [JsonPropertyName("confidence")]
        public double? Confidence
        {
            get;
            init;
        }

        [JsonPropertyName("requiresHumanApproval")]
        public bool? RequiresHumanApproval
        {
            get;
            init;
        }

        [JsonPropertyName("effortBand")]
        public string? EffortBand
        {
            get;
            init;
        }

        [JsonPropertyName("riskReductionLevel")]
        public string? RiskReductionLevel
        {
            get;
            init;
        }

        [JsonPropertyName("notes")]
        public string? Notes
        {
            get;
            init;
        }
    }

    internal sealed class SemanticAssessmentResponseShape
    {
        [JsonPropertyName("assessment")]
        public string? Assessment
        {
            get;
            init;
        }

        [JsonPropertyName("notes")]
        public string? Notes
        {
            get;
            init;
        }
    }
}
