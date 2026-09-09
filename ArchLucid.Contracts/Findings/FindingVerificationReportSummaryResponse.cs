namespace ArchLucid.Contracts.Findings;

public sealed class FindingVerificationReportSummaryResponse
{
    public required Guid ReportId
    {
        get;
        init;
    }

    public required Guid RunId
    {
        get;
        init;
    }

    public required string SourceManifestHash
    {
        get;
        init;
    }

    public required string ReportHash
    {
        get;
        init;
    }

    public Guid? VerificationFindingsSnapshotId
    {
        get;
        init;
    }

    public required DateTime CreatedUtc
    {
        get;
        init;
    }

    public required int ResultCount
    {
        get;
        init;
    }

    public double? ConfirmedRate
    {
        get;
        init;
    }
}
