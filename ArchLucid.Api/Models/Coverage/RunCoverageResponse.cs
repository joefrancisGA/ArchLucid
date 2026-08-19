using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunCoverageResponse
{
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public CoverageSummaryResponse Summary
    {
        get;
        init;
    } = new();
}
