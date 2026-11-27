namespace ArchLucid.Contracts.InfraEvidence;

/// <summary>A snapshot-scoped projection of public IP configuration. It does not test live connectivity.</summary>
public sealed record PublicIpAssessmentResponse(
    Guid SnapshotId,
    DateTime? CapturedUtc,
    string CaptureStatus,
    bool HasCaptureGaps,
    string ObservedReachability,
    int Page,
    int PageSize,
    int TotalCount,
    IReadOnlyList<PublicIpAssessmentItem> Items)
{
    public bool HasMore => (long)Page * PageSize < TotalCount;
}
