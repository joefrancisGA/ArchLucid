using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class AgentExecutionTraceResponse
{
    public List<AgentExecutionTrace> Traces { get; set; } = [];
    public int TotalCount
    {
        get; set;
    }
    public int PageNumber
    {
        get; set;
    }
    public int PageSize
    {
        get; set;
    }
}
