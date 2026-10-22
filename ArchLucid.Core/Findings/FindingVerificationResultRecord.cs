using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

public sealed class FindingVerificationResultRecord
{
    public required Guid ResultId
    {
        get;
        init;
    }

    public required Guid ReportId
    {
        get;
        init;
    }

    public required string FindingId
    {
        get;
        init;
    }

    public required FindingVerificationStatus Status
    {
        get;
        init;
    }

    public required string TraceText
    {
        get;
        init;
    }
}
