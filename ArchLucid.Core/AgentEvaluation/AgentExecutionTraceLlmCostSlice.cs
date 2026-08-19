namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Token and deployment fields extracted from <c>TraceJson</c> without deserializing the full trace blob (TB-577).
/// </summary>
public sealed class AgentExecutionTraceLlmCostSlice
{
    public string? ModelDeploymentName
    {
        get;
        init;
    }

    public int? InputTokenCount
    {
        get;
        init;
    }

    public int? OutputTokenCount
    {
        get;
        init;
    }

    public int? ReasoningTokenCount
    {
        get;
        init;
    }
}
