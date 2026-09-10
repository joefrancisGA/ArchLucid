namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationSnapshotNotFoundException : Exception
{
    public FindingVerificationSnapshotNotFoundException(Guid findingsSnapshotId)
        : base($"Verification findings snapshot '{findingsSnapshotId:D}' was not found in scope.")
    {
        FindingsSnapshotId = findingsSnapshotId;
    }

    public Guid FindingsSnapshotId
    {
        get;
    }
}
