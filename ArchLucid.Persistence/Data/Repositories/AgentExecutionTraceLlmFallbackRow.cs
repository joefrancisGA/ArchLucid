namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper row for the distinct agent types that fell back to the shared LLM completion deployment, keyed by run.
/// </summary>
internal sealed class AgentExecutionTraceLlmFallbackRow
{
    public Guid RunId
    {
        get;
        init;
    }

    public string AgentType
    {
        get;
        init;
    } = string.Empty;
}
