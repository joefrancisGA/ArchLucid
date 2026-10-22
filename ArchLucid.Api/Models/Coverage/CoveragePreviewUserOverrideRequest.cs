using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class CoveragePreviewUserOverrideRequest
{
    public Guid PolicyPackId
    {
        get;
        init;
    }

    public bool Excluded
    {
        get;
        init;
    }

    public string? ExclusionReason
    {
        get;
        init;
    }
}
