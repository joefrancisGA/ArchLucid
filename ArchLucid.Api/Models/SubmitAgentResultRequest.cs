using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class SubmitAgentResultRequest
{
    public AgentResult Result
    {
        get;
        set;
    } = new();
}
