using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class LlmBackedArchitectureRecommendationEngine : IAsyncArchitectureRecommendationEngine
{
    private readonly IArchitectureIntelligenceLlmGateway _gateway;
    private readonly ArchitectureRecommendationEngine _heuristicEngine;

    public LlmBackedArchitectureRecommendationEngine(
        IArchitectureIntelligenceLlmGateway gateway,
        ArchitectureRecommendationEngine heuristicEngine)
    {
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _heuristicEngine = heuristicEngine ?? throw new ArgumentNullException(nameof(heuristicEngine));
    }

    public async Task<IReadOnlyList<ArchitectureRecommendation>> BuildRecommendationsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(declaredPriorities);

        IReadOnlyList<ArchitectureRecommendation>? llmRecommendations =
            await _gateway.DraftRecommendationsAsync(model, findings, declaredPriorities, cancellationToken);

        if (llmRecommendations is { Count: > 0 })
        {
            return llmRecommendations;
        }

        return _heuristicEngine.BuildRecommendations(model, findings, declaredPriorities);
    }
}
