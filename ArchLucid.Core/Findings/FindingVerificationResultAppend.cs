using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

public sealed class FindingVerificationResultAppend
{
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
