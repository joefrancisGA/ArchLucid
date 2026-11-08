using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

public sealed class FindingVerificationReportResponse
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

    private IReadOnlyList<FindingVerificationResultResponse> results = [];

    public required IReadOnlyList<FindingVerificationResultResponse> Results
    {
        get => results;
        init => results = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
