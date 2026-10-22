using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IDifficultyBasedExtractionRouter
{
    ExtractionDifficulty Classify(string sourceText);

    IReadOnlyList<ArchitectureModelElement> Extract(string sourceText, string artifactId);
}
