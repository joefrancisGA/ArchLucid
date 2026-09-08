using ArchLucid.Core.Findings;

namespace ArchLucid.ArtifactSynthesis.FindingVerification.Models;

public sealed class FindingVerificationReportDocumentModel
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

    public required FindingVerificationReportConfirmedRateSummary Summary
    {
        get;
        init;
    }

    public required IReadOnlyList<FindingVerificationReportFindingRow> Findings
    {
        get;
        init;
    }
}
