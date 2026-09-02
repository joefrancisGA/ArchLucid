using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public interface IRecurrenceIdentityMatcher
{
    Task<RecurrenceMatchResult> MatchAsync(
        ScopeContext scope,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        CancellationToken cancellationToken);

    HashSet<string> ResolveCurrentScopeIdentities(
        GraphSnapshot graphSnapshot,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        IReadOnlyDictionary<string, HashSet<string>> identitiesBySystem);
}
