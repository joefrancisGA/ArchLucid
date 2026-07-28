using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class LlmBackedArchitectureExtractionService : IAsyncArchitectureExtractionService
{
    private readonly IArchitectureIntelligenceLlmGateway _gateway;
    private readonly IDifficultyBasedExtractionRouter _heuristicRouter;

    public LlmBackedArchitectureExtractionService(
        IArchitectureIntelligenceLlmGateway gateway,
        IDifficultyBasedExtractionRouter heuristicRouter)
    {
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _heuristicRouter = heuristicRouter ?? throw new ArgumentNullException(nameof(heuristicRouter));
    }

    public async Task<IReadOnlyList<ArchitectureModelElement>> ExtractAsync(
        string sourceText,
        string artifactId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<ArchitectureModelElement>? llmElements =
            await _gateway.ExtractElementsAsync(sourceText, artifactId, cancellationToken);

        if (llmElements is { Count: > 0 })
        {
            return llmElements;
        }

        return _heuristicRouter.Extract(sourceText, artifactId);
    }
}
