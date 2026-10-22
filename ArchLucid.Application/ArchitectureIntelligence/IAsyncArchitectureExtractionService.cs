using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAsyncArchitectureExtractionService
{
    Task<IReadOnlyList<ArchitectureModelElement>> ExtractAsync(
        string sourceText,
        string artifactId,
        CancellationToken cancellationToken = default);
}
