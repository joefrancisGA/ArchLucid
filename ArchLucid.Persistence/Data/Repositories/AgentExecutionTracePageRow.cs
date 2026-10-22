namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper row for a paged trace blob read. <c>TotalCount</c> is a window aggregate repeated on every row, so the
///     page and its total arrive in one round trip.
/// </summary>
internal sealed class AgentExecutionTracePageRow
{
    public string TraceJson
    {
        get;
        init;
    } = string.Empty;

    public int TotalCount
    {
        get;
        init;
    }
}
