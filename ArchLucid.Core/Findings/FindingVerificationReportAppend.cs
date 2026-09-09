namespace ArchLucid.Core.Findings;

public sealed class FindingVerificationReportAppend
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public required Guid WorkspaceId
    {
        get;
        init;
    }

    public required Guid ScopeProjectId
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

    public required Guid SourceFindingsSnapshotId
    {
        get;
        init;
    }

    public Guid? VerificationFindingsSnapshotId
    {
        get;
        init;
    }

    public required string TriggeredByUserId
    {
        get;
        init;
    }

    public required IReadOnlyList<FindingVerificationResultAppend> Results
    {
        get;
        init;
    }
}
