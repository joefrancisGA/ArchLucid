using System.Text.Json;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Llm;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

using static ArchitectureIntelligenceLlmJsonCompletionHelper;
using static ArchitectureIntelligenceLlmResponseMapper;
using static ArchitectureIntelligenceLlmResponseShapes;

public sealed class ArchitectureIntelligenceLlmGateway : IArchitectureIntelligenceLlmGateway
{
    private readonly IAgentCompletionClient? _completionClient;

    public ArchitectureIntelligenceLlmGateway(IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        _completionClient = serviceProvider.GetService<IAgentCompletionClient>();
    }

    public bool IsClientAvailable => _completionClient is not null;

    public async Task<IReadOnlyList<ArchitectureModelElement>?> ExtractElementsAsync(
        string sourceText,
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        if (!IsClientAvailable || string.IsNullOrWhiteSpace(sourceText) || string.IsNullOrWhiteSpace(artifactId))
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

        string? responseJson = await TryCompleteJsonAsync(
            _completionClient,
            systemPrompt,
            userPrompt,
            cancellationToken);

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
        if (!IsClientAvailable || model is null)
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

        string? responseJson = await TryCompleteJsonAsync(
            _completionClient,
            systemPrompt,
            userPrompt,
            cancellationToken);

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
        if (!IsClientAvailable || findings is null || findings.Count == 0)
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

        string? responseJson = await TryCompleteJsonAsync(
            _completionClient,
            systemPrompt,
            userPrompt,
            cancellationToken);

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
        if (!IsClientAvailable || string.IsNullOrWhiteSpace(claimedConclusion))
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

        string? responseJson = await TryCompleteJsonAsync(
            _completionClient,
            systemPrompt,
            userPrompt,
            cancellationToken);

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
        if (!IsClientAvailable || model is null || findings is null || findings.Count == 0)
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

        string? responseJson = await TryCompleteJsonAsync(
            _completionClient,
            systemPrompt,
            userPrompt,
            cancellationToken);

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
}
