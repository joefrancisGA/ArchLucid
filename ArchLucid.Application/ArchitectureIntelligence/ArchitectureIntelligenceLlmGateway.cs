using System.Text.Json;
using System.Text.Json.Serialization;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Llm;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureIntelligenceLlmGateway : IArchitectureIntelligenceLlmGateway
{
    private const string JsonOnlyInstruction =
        "Return ONLY valid JSON. No markdown fences or commentary. " +
        "Label each claim as evidence-backed (directly supported by supplied text) or inferred. " +
        "Never invent regulations or compliance obligations. " +
        "Label cloud-specific assumptions explicitly when present.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentCompletionClient? _completionClient;

    public ArchitectureIntelligenceLlmGateway(IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        _completionClient = serviceProvider.GetService<IAgentCompletionClient>();
    }

    public async Task<IReadOnlyList<ArchitectureModelElement>?> ExtractElementsAsync(
        string sourceText,
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        if (_completionClient is null || string.IsNullOrWhiteSpace(sourceText) || string.IsNullOrWhiteSpace(artifactId))
        {
            return null;
        }

        string systemPrompt =
            "You extract architecture model elements from source text. " +
            JsonOnlyInstruction + " " +
            "Respond with JSON: {\"elements\":[{\"kind\":\"Component\",\"name\":\"...\",\"description\":\"...\", " +
            "\"supportStatus\":\"DirectlyEstablished|IndirectlySupported|NotYetEvaluated\", " +
            "\"origin\":\"DirectlyExtracted|ModelInferred|SystemProposed\", \"confidence\":0.0, \"notes\":\"...\"}]}";

        string userPrompt = $"ArtifactId: {artifactId}\n\nSource:\n{sourceText}";

        string? responseJson = await TryCompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return null;
        }

        ExtractionResponseShape? shape = TryDeserialize<ExtractionResponseShape>(responseJson);

        if (shape?.Elements is null || shape.Elements.Count == 0)
        {
            return null;
        }

        List<ArchitectureModelElement> elements = [];

        foreach (ExtractionElementShape item in shape.Elements)
        {
            ArchitectureModelElement? element = MapExtractionElement(item, artifactId);

            if (element is not null)
            {
                elements.Add(element);
            }
        }

        return elements.Count > 0 ? elements : null;
    }

    public async Task<SpecialistReviewResult?> ReviewDimensionAsync(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        CancellationToken cancellationToken = default)
    {
        if (_completionClient is null || model is null)
        {
            return null;
        }

        string systemPrompt =
            "You are an architecture specialist reviewer for one quality dimension. " +
            JsonOnlyInstruction + " " +
            "Respond with JSON: {\"dimension\":\"Reliability|Security|Cost|...\", \"findings\":[{\"title\":\"...\", " +
            "\"rationale\":\"...\", \"conclusion\":\"Pass|Fail|Indeterminate|NotApplicable\", " +
            "\"evidenceCondition\":\"Sufficient|Insufficient|Conflicting\", " +
            "\"severity\":\"Critical|High|Medium|Low\", \"confidence\":0.0, \"supportStatus\":\"...\", \"notes\":\"...\"}], " +
            "\"openQuestions\":[\"...\"]}";

        string userPrompt = BuildModelSummaryPrompt(model, dimension);

        string? responseJson = await TryCompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return null;
        }

        ReviewResponseShape? shape = TryDeserialize<ReviewResponseShape>(responseJson);

        if (shape?.Findings is null || shape.Findings.Count == 0)
        {
            return null;
        }

        List<SpecialistReviewFinding> findings = shape.Findings
            .Select(item => MapReviewFinding(item, dimension))
            .Where(finding => !string.IsNullOrWhiteSpace(finding.Title))
            .ToList();

        if (findings.Count == 0)
        {
            return null;
        }

        return new SpecialistReviewResult
        {
            Dimension = dimension,
            Findings = findings,
            OpenQuestions = shape.OpenQuestions?
                .Where(question => !string.IsNullOrWhiteSpace(question))
                .Select(question => question.Trim())
                .ToList() ?? [],
        };
    }

    public async Task<IReadOnlyList<AdversarialChallenge>?> GenerateAdversarialChallengesAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken = default)
    {
        if (_completionClient is null || findings is null || findings.Count == 0)
        {
            return null;
        }

        string systemPrompt =
            "You challenge architecture findings adversarially. " +
            JsonOnlyInstruction + " " +
            "Respond with JSON: {\"challenges\":[{\"hypothesis\":\"...\", \"falsificationEvidenceNeeded\":\"...\", " +
            "\"confidence\":0.0, \"suppressed\":false, \"suppressionReason\":null}]}";

        string userPrompt = JsonSerializer.Serialize(
            findings.Select(finding => new
            {
                finding.FindingId,
                finding.Title,
                finding.Rationale,
                Conclusion = finding.Conclusion.ToString(),
            }),
            JsonOptions);

        string? responseJson = await TryCompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return null;
        }

        AdversarialResponseShape? shape = TryDeserialize<AdversarialResponseShape>(responseJson);

        if (shape?.Challenges is null || shape.Challenges.Count == 0)
        {
            return null;
        }

        List<AdversarialChallenge> challenges = shape.Challenges
            .Where(item => !string.IsNullOrWhiteSpace(item.Hypothesis))
            .Select(item => new AdversarialChallenge
            {
                ChallengeId = Guid.NewGuid().ToString("N"),
                Hypothesis = item.Hypothesis!.Trim(),
                FalsificationEvidenceNeeded = item.FalsificationEvidenceNeeded?.Trim() ?? string.Empty,
                Confidence = item.Confidence ?? 0.5,
                Lane = AdversarialLane.AdversarialChallenge,
                Suppressed = item.Suppressed ?? false,
                SuppressionReason = item.SuppressionReason,
            })
            .ToList();

        return challenges.Count > 0 ? challenges : null;
    }

    public async Task<SemanticSupportAssessment?> AssessSemanticSupportAsync(
        string claimedConclusion,
        IReadOnlyList<string> citedQuotes,
        CancellationToken cancellationToken = default)
    {
        if (_completionClient is null || string.IsNullOrWhiteSpace(claimedConclusion))
        {
            return null;
        }

        string systemPrompt =
            "You assess whether cited source quotes semantically support an architecture claim. " +
            JsonOnlyInstruction + " " +
            "Respond with JSON: {\"assessment\":\"Supports|PartiallySupports|Contradicts|DoesNotEstablish\", \"notes\":\"...\"}";

        string userPrompt =
            $"Claimed conclusion:\n{claimedConclusion}\n\nCited quotes:\n" +
            JsonSerializer.Serialize(citedQuotes ?? [], JsonOptions);

        string? responseJson = await TryCompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return null;
        }

        SemanticAssessmentResponseShape? shape = TryDeserialize<SemanticAssessmentResponseShape>(responseJson);

        if (shape?.Assessment is null)
        {
            return null;
        }

        if (Enum.TryParse(shape.Assessment, ignoreCase: true, out SemanticSupportAssessment assessment))
        {
            return assessment;
        }

        return null;
    }

    public async Task<IReadOnlyList<ArchitectureRecommendation>?> DraftRecommendationsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken = default)
    {
        if (_completionClient is null || model is null || findings is null || findings.Count == 0)
        {
            return null;
        }

        string systemPrompt =
            "You draft architecture recommendations from specialist findings. " +
            JsonOnlyInstruction + " " +
            "Respond with JSON: {\"recommendations\":[{\"problem\":\"...\", \"evidence\":\"...\", " +
            "\"affectedRequirementOrQualityAttribute\":\"...\", \"consequenceOfInaction\":\"...\", " +
            "\"proposedChange\":\"...\", \"alternatives\":[\"...\"], \"validationMethod\":\"...\", " +
            "\"confidence\":0.0, \"requiresHumanApproval\":false, \"effortBand\":\"Low|Medium|High\", " +
            "\"riskReductionLevel\":\"Low|Moderate|High\", \"notes\":\"...\"}]}";

        string userPrompt =
            $"Declared priorities: {string.Join(", ", declaredPriorities ?? [])}\n" +
            BuildModelSummaryPrompt(model, null) + "\n" +
            "Findings:\n" +
            JsonSerializer.Serialize(findings.Select(finding => new
            {
                finding.FindingId,
                finding.Title,
                finding.Rationale,
                Dimension = finding.Dimension.ToString(),
                Conclusion = finding.Conclusion.ToString(),
                finding.Severity,
            }), JsonOptions);

        string? responseJson = await TryCompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
        {
            return null;
        }

        RecommendationResponseShape? shape = TryDeserialize<RecommendationResponseShape>(responseJson);

        if (shape?.Recommendations is null || shape.Recommendations.Count == 0)
        {
            return null;
        }

        List<ArchitectureRecommendation> recommendations = shape.Recommendations
            .Where(item => !string.IsNullOrWhiteSpace(item.Problem))
            .Select(MapRecommendation)
            .ToList();

        return recommendations.Count > 0 ? recommendations : null;
    }

    private async Task<string?> TryCompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        if (_completionClient is null)
        {
            return null;
        }

        try
        {
            string response = await _completionClient.CompleteJsonAsync(
                systemPrompt,
                userPrompt,
                maxTokens: null,
                temperature: null,
                cancellationToken: cancellationToken);

            return string.IsNullOrWhiteSpace(response) ? null : response;
        }
        catch (JsonException)
        {
            return null;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    private static T? TryDeserialize<T>(string responseJson)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(responseJson, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static string BuildModelSummaryPrompt(ArchitectureKnowledgeModel model, QualityDimension? dimension)
    {
        IEnumerable<ArchitectureModelElement> elements = model.Elements;

        if (dimension is not null)
        {
            elements = elements.Take(50);
        }

        string elementSummary = string.Join(
            "\n",
            elements.Select(element => $"- [{element.Kind}] {element.Name}: {element.Description ?? element.Provenance.Notes}"));

        string dimensionLine = dimension is null ? string.Empty : $"Focus dimension: {dimension}\n";

        return dimensionLine +
               $"ModelId: {model.ModelId}\n" +
               $"TenantId: {model.TenantId}\n" +
               $"Elements ({model.Elements.Count}):\n{elementSummary}";
    }

    private static ArchitectureModelElement? MapExtractionElement(ExtractionElementShape item, string artifactId)
    {
        if (string.IsNullOrWhiteSpace(item.Name))
        {
            return null;
        }

        if (!Enum.TryParse(item.Kind, ignoreCase: true, out ArchitectureElementKind kind))
        {
            kind = ArchitectureElementKind.Assumption;
        }

        SupportStatus supportStatus = ParseSupportStatus(item.SupportStatus);
        ClaimOrigin origin = ParseClaimOrigin(item.Origin);

        return new ArchitectureModelElement
        {
            ElementId = Guid.NewGuid().ToString("N"),
            Kind = kind,
            Name = item.Name.Trim(),
            Description = item.Description?.Trim(),
            ExtractionConfidence = ClampConfidence(item.Confidence),
            SourcePassageIds = [artifactId],
            Provenance = new ClaimProvenance
            {
                Origin = origin,
                SupportStatus = supportStatus,
                Confidence = ClampConfidence(item.Confidence),
                SourceArtifactId = artifactId,
                Notes = item.Notes?.Trim(),
            },
        };
    }

    private static SpecialistReviewFinding MapReviewFinding(ReviewFindingShape item, QualityDimension dimension)
    {
        ReviewConclusion conclusion = ParseReviewConclusion(item.Conclusion);
        EvidenceCondition evidenceCondition = ParseEvidenceCondition(item.EvidenceCondition);

        return new SpecialistReviewFinding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = item.Title?.Trim() ?? string.Empty,
            Rationale = item.Rationale?.Trim() ?? string.Empty,
            Conclusion = conclusion,
            EvidenceCondition = evidenceCondition,
            GovernanceDisposition = conclusion == ReviewConclusion.Pass
                ? GovernanceDisposition.Accepted
                : GovernanceDisposition.Open,
            Confidence = ClampConfidence(item.Confidence),
            Severity = string.IsNullOrWhiteSpace(item.Severity) ? "Medium" : item.Severity.Trim(),
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = ParseSupportStatus(item.SupportStatus),
                Confidence = ClampConfidence(item.Confidence),
                Notes = item.Notes?.Trim(),
            },
        };
    }

    private static ArchitectureRecommendation MapRecommendation(RecommendationShape item)
    {
        return new ArchitectureRecommendation
        {
            RecommendationId = Guid.NewGuid().ToString("N"),
            Problem = item.Problem!.Trim(),
            Evidence = item.Evidence?.Trim() ?? string.Empty,
            AffectedRequirementOrQualityAttribute = item.AffectedRequirementOrQualityAttribute?.Trim() ?? string.Empty,
            ConsequenceOfInaction = item.ConsequenceOfInaction?.Trim() ?? string.Empty,
            ProposedChange = item.ProposedChange?.Trim() ?? string.Empty,
            Alternatives = item.Alternatives?
                .Where(alternative => !string.IsNullOrWhiteSpace(alternative))
                .Select(alternative => alternative.Trim())
                .ToList() ?? [],
            ValidationMethod = item.ValidationMethod?.Trim() ?? "Re-run specialist review after design update.",
            Confidence = ClampConfidence(item.Confidence),
            RequiresHumanApproval = item.RequiresHumanApproval ?? false,
            Effort = new EffortEstimate
            {
                Band = string.IsNullOrWhiteSpace(item.EffortBand) ? "Medium" : item.EffortBand.Trim(),
                BasisNotes = item.Notes?.Trim() ?? string.Empty,
                ImplementationEstimateAvailable = true,
            },
            RiskReduction = new RiskReductionEstimate
            {
                Level = string.IsNullOrWhiteSpace(item.RiskReductionLevel) ? "Moderate" : item.RiskReductionLevel.Trim(),
                ScenarioNotes = item.Notes?.Trim(),
            },
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = ClampConfidence(item.Confidence),
                Notes = item.Notes?.Trim(),
            },
        };
    }

    private static double ClampConfidence(double? confidence)
    {
        double value = confidence ?? 0.5;

        if (value < 0)
        {
            return 0;
        }

        if (value > 1)
        {
            return 1;
        }

        return value;
    }

    private static SupportStatus ParseSupportStatus(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out SupportStatus parsed))
        {
            return parsed;
        }

        return SupportStatus.NotYetEvaluated;
    }

    private static ClaimOrigin ParseClaimOrigin(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out ClaimOrigin parsed))
        {
            return parsed;
        }

        return ClaimOrigin.ModelInferred;
    }

    private static ReviewConclusion ParseReviewConclusion(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out ReviewConclusion parsed))
        {
            return parsed;
        }

        return ReviewConclusion.Indeterminate;
    }

    private static EvidenceCondition ParseEvidenceCondition(string? value)
    {
        if (Enum.TryParse(value, ignoreCase: true, out EvidenceCondition parsed))
        {
            return parsed;
        }

        return EvidenceCondition.Insufficient;
    }

    private sealed class ExtractionResponseShape
    {
        [JsonPropertyName("elements")]
        public List<ExtractionElementShape>? Elements
        {
            get;
            init;
        }
    }

    private sealed class ExtractionElementShape
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

    private sealed class ReviewResponseShape
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

    private sealed class ReviewFindingShape
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

    private sealed class AdversarialResponseShape
    {
        [JsonPropertyName("challenges")]
        public List<AdversarialChallengeShape>? Challenges
        {
            get;
            init;
        }
    }

    private sealed class AdversarialChallengeShape
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

    private sealed class RecommendationResponseShape
    {
        [JsonPropertyName("recommendations")]
        public List<RecommendationShape>? Recommendations
        {
            get;
            init;
        }
    }

    private sealed class RecommendationShape
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

    private sealed class SemanticAssessmentResponseShape
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
