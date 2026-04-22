using System.Diagnostics.CodeAnalysis;

using ArchLucid.Application.Diffs;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class AgentResultCompareResponse
{
    public AgentResultDiffResult Diff
    {
        get;
        set;
    } = new();
}
