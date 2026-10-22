using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Which analyses produced results in each of the two correlated reviews (TB-2194), so a prior finding's absence
///     can be judged against whether anything still looked for it.
///     <para>
///         Coverage is taken from the presence of agent <em>results</em>, never from the findings themselves. An
///         analysis that ran and found nothing is precisely the remediation case; deriving coverage from findings would
///         mark every genuine fix as uncovered.
///     </para>
/// </summary>
public sealed class CrossReviewFindingSourceCoverage
{
    public IReadOnlySet<AgentType> PriorAgentTypes
    {
        get;
        init;
    } = new HashSet<AgentType>();

    public IReadOnlySet<AgentType> CurrentAgentTypes
    {
        get;
        init;
    } = new HashSet<AgentType>();

    /// <summary>Analyses that produced results in the prior review but not in the newer one.</summary>
    public IReadOnlyList<AgentType> AgentTypesMissingFromCurrent =>
        PriorAgentTypes.Where(agentType => !CurrentAgentTypes.Contains(agentType)).OrderBy(agentType => agentType).ToArray();

    /// <summary>True when the newer review examined less than the prior one, so absence is not a reliable signal.</summary>
    public bool HasReducedCoverage => AgentTypesMissingFromCurrent.Count > 0;

    /// <summary>Whether the newer review still ran the analysis that produced a given finding.</summary>
    public bool CoversInCurrent(AgentType agentType)
    {
        return CurrentAgentTypes.Contains(agentType);
    }
}
