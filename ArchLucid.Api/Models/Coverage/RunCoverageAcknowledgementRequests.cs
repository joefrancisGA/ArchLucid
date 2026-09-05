using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class PutRunCoverageAcknowledgementRequest
{
    public IReadOnlyList<RunCoverageAcknowledgementEntryRequest>? Entries
    {
        get;
        init;
    }
}

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class RunCoverageAcknowledgementEntryRequest
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

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class PatchRunCoveragePackRequest
{
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
