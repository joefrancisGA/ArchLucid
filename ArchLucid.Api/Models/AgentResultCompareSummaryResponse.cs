using System.Diagnostics.CodeAnalysis;

using ArchLucid.Application.Diffs;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class AgentResultCompareSummaryResponse
{
    public string Format
    {
        get;
        set;
    } = "markdown";

    public string Summary
    {
        get;
        set;
    } = string.Empty;

    public AgentResultDiffResult Diff
    {
        get;
        set;
    } = new();
}
