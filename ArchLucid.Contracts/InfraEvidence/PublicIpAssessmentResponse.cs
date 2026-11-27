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

public sealed record PublicIpAssessmentItem(
    string PublicIpResourceId,
    string? IpAddress,
    string AttachmentStatus,
    string? AttachedResourceId,
    string IntendedReachability,
    IReadOnlyList<PublicIpAssessmentEvidence> Evidence);

/// <summary>A local citation to an inventory resource row, never a raw source URL or a premium path ID.</summary>
public sealed record PublicIpAssessmentEvidence(Guid ResourceRowId, string Kind, string Provenance);
