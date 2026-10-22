using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceLlmGateway
{
    /// <summary>
    ///     True when an <c>IAgentCompletionClient</c> is registered for this scope.
    /// </summary>
    bool IsClientAvailable
    {
        get;
    }

    Task<IReadOnlyList<ArchitectureModelElement>?> ExtractElementsAsync(
        string sourceText,
        string artifactId,
        CancellationToken cancellationToken = default);

    Task<SpecialistReviewResult?> ReviewDimensionAsync(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdversarialChallenge>?> GenerateAdversarialChallengesAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureRecommendation>?> DraftRecommendationsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Stage-3 semantic support assessment. Returns null when the LLM client is unavailable or parsing fails.
    /// </summary>
    Task<SemanticSupportAssessment?> AssessSemanticSupportAsync(
        string claimedConclusion,
        IReadOnlyList<string> citedQuotes,
        CancellationToken cancellationToken = default);
}
