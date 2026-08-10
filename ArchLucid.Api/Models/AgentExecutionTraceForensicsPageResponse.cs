using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Models;

/// <summary>
///     Operator/internal paginated LLM trace forensics list (summaries only; full TraceJson via by-id route).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class AgentExecutionTraceForensicsPageResponse
{
    public List<AgentExecutionTraceSummary> Traces
    {
        get;
        set;
    } = [];

    public int TotalCount
    {
        get;
        set;
    }

    public int PageNumber
    {
        get;
        set;
    }

    public int PageSize
    {
        get;
        set;
    }
}
