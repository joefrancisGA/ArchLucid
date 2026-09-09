using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Findings;

/// <summary>Default no-op insight generator for Simulator hosts and unit tests.</summary>
public sealed class NoOpInsightFindingGenerator : IInsightFindingGenerator
{
    public static NoOpInsightFindingGenerator Instance { get; } = new();

    public Task<IReadOnlyList<Finding>> GenerateAsync(
        IReadOnlyList<Finding> engineFindings,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default)
    {
        _ = engineFindings;
        _ = graphSnapshot;
        _ = analysisContext;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<Finding>>([]);
    }
}
