using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class ExecuteRunResponse
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public List<AgentResult> Results
    {
        get;
        set;
    } = [];
}
