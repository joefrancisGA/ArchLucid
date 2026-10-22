namespace ArchLucid.Contracts.Findings;

public sealed class FindingVerificationResultResponse
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
