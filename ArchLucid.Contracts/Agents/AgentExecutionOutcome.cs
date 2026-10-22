namespace ArchLucid.Contracts.Agents;

using ArchLucid.Contracts.Common;

/// <summary>Compact per-agent execution outcome for API / operator review detail (TB-937).</summary>
public sealed class AgentExecutionOutcome
{
    public required AgentType AgentType
    {
        get;
        init;
    }

    public required AgentExecutionOutcomeKind Outcome
    {
        get;
        init;
    }

    public string? TaskId
    {
        get;
        init;
    }

    public string? DegradationReasonCode
    {
        get;
        init;
    }
}
