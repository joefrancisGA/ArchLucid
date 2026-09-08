using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Findings;

/// <summary>Default no-op prose assumption generator for Simulator hosts and unit tests.</summary>
public sealed class NoOpProseAssumptionFindingGenerator : IProseAssumptionFindingGenerator
{
    public static NoOpProseAssumptionFindingGenerator Instance { get; } = new();

    public Task<IReadOnlyList<Finding>> GenerateAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default)
    {
        _ = graphSnapshot;
        _ = analysisContext;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<Finding>>([]);
    }
}
