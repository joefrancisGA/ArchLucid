using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

public interface ISharedTopologyMatcher
{
    Task<IReadOnlyList<SharedTopologyConflict>> MatchAsync(
        ScopeContext scope,
        GraphSnapshot currentGraph,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        CancellationToken cancellationToken);
}
