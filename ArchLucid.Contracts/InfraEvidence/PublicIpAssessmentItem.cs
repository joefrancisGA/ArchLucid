namespace ArchLucid.Contracts.InfraEvidence;

public sealed record PublicIpAssessmentItem(
    string PublicIpResourceId,
    string? IpAddress,
    string AttachmentStatus,
    string? AttachedResourceId,
    string IntendedReachability,
    IReadOnlyList<PublicIpAssessmentEvidence> Evidence);
