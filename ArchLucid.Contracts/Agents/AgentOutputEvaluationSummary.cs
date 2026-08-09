namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Run agent-evaluation with explicit recorded vs advisory-current authority split (TB-973).
///     Authority surfaces must read <see cref="Recorded" />; <see cref="AdvisoryCurrent" /> is diagnostic only.
/// </summary>
public sealed class AgentOutputEvaluationSummary
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public DateTime EvaluatedAtUtc
    {
        get;
        set;
    }

    /// <summary>
    ///     Evaluate-time view from persisted trace snapshots. Null when no traces carry recorded gate snapshots
    ///     (for example pre-TB-973 runs).
    /// </summary>
    public AgentOutputEvaluationPerspective? Recorded
    {
        get;
        set;
    }

    /// <summary>Live host-floor recompute; non-authoritative.</summary>
    public required AgentOutputEvaluationPerspective AdvisoryCurrent
    {
        get;
        set;
    }
}
