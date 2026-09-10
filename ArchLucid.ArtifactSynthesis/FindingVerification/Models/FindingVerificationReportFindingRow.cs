namespace ArchLucid.ArtifactSynthesis.FindingVerification.Models;

public sealed class FindingVerificationReportFindingRow
{
    public required string FindingId
    {
        get;
        init;
    }

    public string? Title
    {
        get;
        init;
    }

    public string? Severity
    {
        get;
        init;
    }

    public required string Status
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
