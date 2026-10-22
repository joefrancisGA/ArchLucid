using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter : IDifficultyBasedExtractionRouter
{
    private const int AmbiguousLengthThreshold = 8000;
}
