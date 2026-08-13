using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Builds <see cref="CrossReviewFindingSourceCoverage" /> from the agent results of two reviews (TB-2194).
/// </summary>
public static class CrossReviewFindingSourceCoverageBuilder
{
    public static CrossReviewFindingSourceCoverage FromAgentResults(
        IReadOnlyCollection<AgentResult> priorResults,
        IReadOnlyCollection<AgentResult> currentResults)
    {
        ArgumentNullException.ThrowIfNull(priorResults);
        ArgumentNullException.ThrowIfNull(currentResults);

        return new CrossReviewFindingSourceCoverage
        {
            PriorAgentTypes = ToAgentTypeSet(priorResults),
            CurrentAgentTypes = ToAgentTypeSet(currentResults),
        };
    }

    private static HashSet<AgentType> ToAgentTypeSet(IReadOnlyCollection<AgentResult> results)
    {
        return results.Select(static result => result.AgentType).ToHashSet();
    }
}
