namespace ArchLucid.Contracts.Findings;

/// <summary>Operator-triggered verification pass request (ADR 0062 slice 1).</summary>
public sealed class CreateFindingVerificationReportRequest
{
    /// <summary>Optional later findings snapshot to verify against; omit for slice-1 NotVerifiable stub.</summary>
    public Guid? VerificationFindingsSnapshotId
    {
        get;
        init;
    }
}
