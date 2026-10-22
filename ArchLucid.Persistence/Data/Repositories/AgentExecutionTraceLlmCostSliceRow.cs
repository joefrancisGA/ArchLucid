namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper row for the multi-run LLM cost slice query. Carries <c>RunId</c> so slices can be grouped back per run.
/// </summary>
internal sealed class AgentExecutionTraceLlmCostSliceRow
{
    public Guid RunId
    {
        get;
        init;
    }

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
