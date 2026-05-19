using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>Result of <c>PATCH /v1/architecture/run/{runId}/pin</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class PinRunResponse
{
    public string RunId
    {
        get;
        set;
    } = "";

    public bool IsPinned
    {
        get;
        set;
    }
}
