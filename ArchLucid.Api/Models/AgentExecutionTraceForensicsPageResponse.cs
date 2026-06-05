using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Models;

/// <summary>Operator/internal paginated full LLM trace forensics (TB-287).</summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class AgentExecutionTraceForensicsPageResponse
{
    public List<AgentExecutionTrace> Traces
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
