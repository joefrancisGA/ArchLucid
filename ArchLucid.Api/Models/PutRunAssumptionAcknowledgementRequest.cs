using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>Body for PUT <c>/v1/architecture/review/{runId}/assumptions/acknowledgement</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class PutRunAssumptionAcknowledgementRequest
{
    /// <summary>Full replacement set of stable assumption ids the operator has confirmed or caveated.</summary>
    public IReadOnlyList<string>? AcknowledgedAssumptionIds
    {
        get;
        init;
    }
}
